// ---------------------------------------------------------------------------
// RedRainbow — Threat Intelligence & Risk Scoring engine
//
// Deterministic, offline enrichment: the same indicator always yields the same
// verdict, so the cockpit behaves like a real feed cache instead of noise.
// Backend swap: replace `computeEnrichment` with a fetch to VirusTotal / MISP /
// abuse.ch and keep the same `IntelReport` contract.
// ---------------------------------------------------------------------------

import type { IOC, IOCType } from "./incidentStore";
import type { Severity } from "./eventBus";
import { bus } from "./eventBus";

export type Verdict = "Malicious" | "Suspicious" | "Benign" | "Unknown";

export interface FeedHit {
  feed: string;
  category: string;
  hit: boolean;
  score: number; // 0-100 contribution
}

export interface IntelReport {
  value: string;
  type: IOCType;
  risk: number;            // 0-100 composite risk score
  verdict: Verdict;
  confidence: number;      // 0-100
  reputation: number;      // 0-100 (higher = cleaner)
  country: string;
  asn: string;
  org: string;
  firstRegistered: string; // WHOIS-ish age
  categories: string[];
  feeds: FeedHit[];
  enrichedAt: number;
}

// ---------- deterministic hashing ------------------------------------------

const hash = (s: string): number => {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
};

const pick = <T>(arr: readonly T[], seed: number): T => arr[seed % arr.length];

const COUNTRIES = ["RU", "CN", "US", "NL", "DE", "BR", "IR", "SG", "FR", "UA"] as const;
const ORGS = [
  "OVH SAS", "DigitalOcean LLC", "Hetzner Online", "Alibaba Cloud",
  "Amazon AWS", "M247 Ltd", "Chang Way Technologies", "Contabo GmbH",
] as const;
const CATEGORIES = [
  "C2 Infrastructure", "Phishing", "Scanner", "TOR Exit Node",
  "Bulletproof Hosting", "Malware Distribution", "Credential Stuffing",
  "Cryptomining Pool", "Benign CDN", "Corporate Range",
] as const;
const FEEDS = ["abuse.ch", "AlienVault OTX", "MISP Core", "VirusTotal", "GreyNoise", "Spamhaus"] as const;

const RISKY_COUNTRIES = new Set(["RU", "CN", "IR", "UA"]);

const typeWeight: Record<IOCType, number> = {
  ip: 12, domain: 10, hash: 22, url: 16, port: 4,
};

// ---------- core engine -----------------------------------------------------

export function computeEnrichment(value: string, type: IOCType): IntelReport {
  const seed = hash(`${type}:${value}`);
  const country = pick(COUNTRIES, seed >> 3);
  const asn = `AS${13000 + (seed % 52000)}`;
  const org = pick(ORGS, seed >> 7);

  const feeds: FeedHit[] = FEEDS.map((feed, i) => {
    const s = hash(`${feed}:${value}`);
    const hit = (s >> (i + 2)) % 100 < 42;
    return {
      feed,
      category: pick(CATEGORIES, s >> 5),
      hit,
      score: hit ? 8 + (s % 14) : 0,
    };
  });

  const feedScore = feeds.reduce((a, f) => a + f.score, 0);
  const geoScore = RISKY_COUNTRIES.has(country) ? 14 : 0;
  const base = typeWeight[type];
  const jitter = seed % 11;

  const risk = Math.max(2, Math.min(99, base + feedScore + geoScore + jitter));
  const reputation = 100 - risk;
  const hits = feeds.filter((f) => f.hit).length;

  const verdict: Verdict =
    risk >= 75 ? "Malicious" : risk >= 50 ? "Suspicious" : hits > 0 ? "Unknown" : "Benign";

  const year = 2008 + (seed % 18);
  const month = String(1 + ((seed >> 4) % 12)).padStart(2, "0");
  const day = String(1 + ((seed >> 9) % 28)).padStart(2, "0");

  return {
    value,
    type,
    risk,
    verdict,
    confidence: Math.min(99, 40 + hits * 11 + (seed % 9)),
    reputation,
    country,
    asn,
    org,
    firstRegistered: `${year}-${month}-${day}`,
    categories: Array.from(new Set(feeds.filter((f) => f.hit).map((f) => f.category))).slice(0, 3),
    feeds,
    enrichedAt: Date.now(),
  };
}

export const riskToSeverity = (risk: number): Severity =>
  risk >= 85 ? "Critical" : risk >= 70 ? "High" : risk >= 45 ? "Medium" : risk >= 25 ? "Low" : "Info";

export const verdictStyle: Record<Verdict, string> = {
  Malicious: "text-primary border-primary/40 bg-primary/10",
  Suspicious: "text-glow-amber border-glow-amber/40 bg-glow-amber/10",
  Unknown: "text-secondary border-secondary/40 bg-secondary/10",
  Benign: "text-glow-green border-glow-green/40 bg-glow-green/10",
};

// ---------- cache (persisted) ----------------------------------------------

const CACHE_KEY = "redrainbow.intel.v1";

type Cache = Record<string, IntelReport>;

const load = (): Cache => {
  if (typeof window === "undefined") return {};
  try { return JSON.parse(window.localStorage.getItem(CACHE_KEY) ?? "{}") as Cache; }
  catch { return {}; }
};

let cache: Cache = load();
const subs = new Set<(c: Cache) => void>();

const persist = () => {
  try { window.localStorage.setItem(CACHE_KEY, JSON.stringify(cache)); } catch { /* quota */ }
  subs.forEach((s) => s(cache));
};

export const subscribeIntel = (cb: (c: Cache) => void) => {
  subs.add(cb); cb(cache);
  return () => { subs.delete(cb); };
};

export const getIntel = (value: string): IntelReport | undefined => cache[value];
export const getIntelCache = () => cache;

/** Enrich a single indicator (simulated feed latency) and broadcast findings. */
export async function enrich(value: string, type: IOCType): Promise<IntelReport> {
  await new Promise((r) => setTimeout(r, 350 + Math.random() * 500));
  const report = computeEnrichment(value, type);
  cache = { ...cache, [value]: report };
  persist();

  bus.emit("telemetry.received", {
    source: "Threat Intel",
    type: "enrichment",
    message: `${value} → ${report.verdict} (risk ${report.risk}) via ${report.feeds.filter((f) => f.hit).length} feeds`,
    severity: riskToSeverity(report.risk),
    at: Date.now(),
  });

  if (report.verdict === "Malicious") {
    bus.emit("notification.created", {
      level: "error",
      title: `Malicious indicator: ${value}`,
      detail: `${report.categories[0] ?? "Threat"} · ${report.country} · ${report.asn}`,
    });
  }

  return report;
}

/** Bulk enrichment used by the "Enrich all" action. */
export async function enrichMany(items: Pick<IOC, "value" | "type">[]): Promise<IntelReport[]> {
  const out: IntelReport[] = [];
  for (const i of items) out.push(await enrich(i.value, i.type));
  return out;
}

export const clearIntel = () => { cache = {}; persist(); };
