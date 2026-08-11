// ---------------------------------------------------------------------------
// RedRainbow — Threat Hunting Workbench store
// Hypothesis-driven search across vault artifacts, IOCs, incidents and the
// audit ledger, plus saved queries and detection-rule templates.
// Client-only, localStorage-persisted; emits bus + audit events.
// ---------------------------------------------------------------------------

import { bus } from "./eventBus";
import { logAudit } from "./auditStore";
import { getPublished, type VaultItem } from "./vaultStore";
import { getIncidents, getIocs } from "./incidentStore";
import { getEntries } from "./auditStore";

export type HuntCorpus = "vault" | "ioc" | "incident" | "audit";

export interface HuntHit {
  id: string;
  corpus: HuntCorpus;
  title: string;
  detail: string;
  at?: number;
  score: number; // 0-100 relevance
  meta?: Record<string, unknown>;
}

export interface SavedQuery {
  id: string;
  name: string;
  hypothesis: string;
  query: string;
  corpora: HuntCorpus[];
  createdAt: number;
  lastRun?: number;
  lastHits?: number;
}

export interface DetectionRule {
  id: string;
  name: string;
  tactic: string;
  severity: "Critical" | "High" | "Medium" | "Low";
  logic: string;
  description: string;
}

// ---------- Detection rule templates ---------------------------------------

export const ruleTemplates: DetectionRule[] = [
  {
    id: "DR-001",
    name: "Suspicious Lateral Movement",
    tactic: "TA0008 · Lateral Movement",
    severity: "High",
    description: "Sealed artifacts referencing SMB/WinRM sessions across more than two hosts within one hour.",
    logic: 'corpus:vault AND (name:"lateral" OR name:"smb" OR name:"winrm") AND distinct(host) > 2',
  },
  {
    id: "DR-002",
    name: "C2 Beacon Cadence",
    tactic: "TA0011 · Command & Control",
    severity: "Critical",
    description: "IOC ledger indicators tagged c2 with repeating hit counts and malicious verdict.",
    logic: 'corpus:ioc AND tag:c2 AND hits >= 3 AND verdict:"Malicious"',
  },
  {
    id: "DR-003",
    name: "Credential Dump Artifact",
    tactic: "TA0006 · Credential Access",
    severity: "Critical",
    description: "Memory dumps or LSASS captures sealed to the vault outside an approved mission window.",
    logic: 'corpus:vault AND (name:"memory_dump" OR name:"lsass") AND NOT source:"mission"',
  },
  {
    id: "DR-004",
    name: "Evidence Custody Anomaly",
    tactic: "TA0005 · Defense Evasion",
    severity: "Medium",
    description: "Custody transitions on artifacts that were never reviewed by a second operator.",
    logic: 'corpus:audit AND action:"custody.changed" AND distinct(actor) == 1',
  },
  {
    id: "DR-005",
    name: "Exfil Staging Volume",
    tactic: "TA0010 · Exfiltration",
    severity: "High",
    description: "Large binaries or archives sealed within a short window of an open incident.",
    logic: 'corpus:vault AND type:"Binary" AND size > 100MB AND incident.status:"Open"',
  },
  {
    id: "DR-006",
    name: "Unresolved Critical Incident SLA",
    tactic: "Operational",
    severity: "High",
    description: "Critical incidents remaining Open beyond the response SLA window.",
    logic: 'corpus:incident AND severity:"Critical" AND status:"Open" AND age > 4h',
  },
];

// ---------- Persistence -----------------------------------------------------

const Q_KEY = "redrainbow.hunt.queries.v1";
const R_KEY = "redrainbow.hunt.rules.v1";

const load = <T,>(k: string, fallback: T): T => {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(k);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch { return fallback; }
};
const save = (k: string, v: unknown) => {
  if (typeof window === "undefined") return;
  try { window.localStorage.setItem(k, JSON.stringify(v)); } catch { /* ignore */ }
};

const seedQueries: SavedQuery[] = [
  {
    id: "HQ-001",
    name: "Beaconing to rare ASNs",
    hypothesis: "An implant is beaconing from a lab isolate to a low-reputation ASN.",
    query: "c2 OR beacon OR tor",
    corpora: ["ioc", "vault"],
    createdAt: Date.now() - 86_400_000 * 3,
  },
  {
    id: "HQ-002",
    name: "Memory captures without mission",
    hypothesis: "Memory was captured outside an authorised mission window.",
    query: "memory OR dump OR raw",
    corpora: ["vault", "audit"],
    createdAt: Date.now() - 86_400_000 * 2,
  },
  {
    id: "HQ-003",
    name: "Open critical exposure",
    hypothesis: "Critical incidents remain open past the containment SLA.",
    query: "critical",
    corpora: ["incident", "audit"],
    createdAt: Date.now() - 86_400_000,
  },
];

let queries: SavedQuery[] = load<SavedQuery[]>(Q_KEY, seedQueries);
let rules: DetectionRule[] = load<DetectionRule[]>(R_KEY, []);

const qListeners = new Set<(q: SavedQuery[]) => void>();
const rListeners = new Set<(r: DetectionRule[]) => void>();

const emitQ = () => { save(Q_KEY, queries); qListeners.forEach((l) => l(queries)); };
const emitR = () => { save(R_KEY, rules); rListeners.forEach((l) => l(rules)); };

export const subscribeQueries = (cb: (q: SavedQuery[]) => void) => {
  qListeners.add(cb); cb(queries); return () => { qListeners.delete(cb); };
};
export const subscribeRules = (cb: (r: DetectionRule[]) => void) => {
  rListeners.add(cb); cb(rules); return () => { rListeners.delete(cb); };
};

export const getQueries = () => queries;
export const getRules = () => rules;

export const saveQuery = (
  partial: Omit<SavedQuery, "id" | "createdAt">,
): SavedQuery => {
  const q: SavedQuery = { id: `HQ-${String(queries.length + 1).padStart(3, "0")}`, createdAt: Date.now(), ...partial };
  queries = [q, ...queries];
  emitQ();
  logAudit({
    domain: "vault", action: "hunt.query.saved", subject: q.id,
    summary: `Saved hunt query "${q.name}"`, meta: { query: q.query, corpora: q.corpora },
  });
  return q;
};

export const removeQuery = (id: string) => {
  queries = queries.filter((q) => q.id !== id);
  emitQ();
};

export const deployRule = (tpl: DetectionRule) => {
  if (rules.some((r) => r.id === tpl.id)) return;
  rules = [{ ...tpl }, ...rules];
  emitR();
  logAudit({
    domain: "response", action: "detection.rule.deployed", subject: tpl.id,
    summary: `Detection rule "${tpl.name}" deployed (${tpl.tactic})`,
    meta: { severity: tpl.severity, logic: tpl.logic },
  });
  bus.emit("notification.raised", {
    id: `NR-${Date.now()}`,
    title: `Detection rule armed — ${tpl.name}`,
    body: tpl.description,
    severity: tpl.severity,
    at: Date.now(),
  });
};

export const retireRule = (id: string) => {
  const r = rules.find((x) => x.id === id);
  rules = rules.filter((x) => x.id !== id);
  emitR();
  if (r) {
    logAudit({
      domain: "response", action: "detection.rule.retired", subject: id,
      summary: `Detection rule "${r.name}" retired`,
    });
  }
};

// ---------- Search engine ---------------------------------------------------

const tokenize = (q: string) =>
  q.toLowerCase().split(/\s+(?:or|and)\s+|\s+/).map((t) => t.trim()).filter((t) => t && t !== "or" && t !== "and");

const scoreOf = (haystack: string, tokens: string[]) => {
  const h = haystack.toLowerCase();
  let hits = 0;
  tokens.forEach((t) => { if (h.includes(t)) hits += 1; });
  if (!hits) return 0;
  return Math.min(100, Math.round((hits / tokens.length) * 80) + 20);
};

const vaultHits = (tokens: string[]): HuntHit[] =>
  (getPublished() as VaultItem[]).concat(seedVaultShadow).map((i) => {
    const score = scoreOf(`${i.name} ${i.id} ${i.type} ${i.custody} ${i.source ?? ""}`, tokens);
    return score
      ? { id: i.id, corpus: "vault" as HuntCorpus, title: i.name, detail: `${i.type} · ${i.size} · custody ${i.custody}${i.source ? ` · ${i.source}` : ""}`, score, meta: { hash: i.hash } }
      : null;
  }).filter((x): x is HuntHit => !!x);

// Mirrors the seeded artifacts rendered on the Vault page so hunts cover them too.
const seedVaultShadow: VaultItem[] = [
  { id: "EV-2847", name: "packet_capture_0412.pcap", type: "Binary", size: "24.7 MB", sealed: "2m ago", hash: "a3f7...c9d2", custody: "Sealed" },
  { id: "EV-2846", name: "lateral_movement_log.json", type: "Log", size: "1.2 MB", sealed: "45m ago", hash: "b8e1...4f7a", custody: "Sealed" },
  { id: "EV-2845", name: "c2_screenshot_proof.png", type: "Screenshot", size: "3.4 MB", sealed: "1h ago", hash: "d2c9...8b3e", custody: "In Review" },
  { id: "EV-2844", name: "memory_dump_qubes01.raw", type: "Binary", size: "512 MB", sealed: "2h ago", hash: "f1a3...7d6c", custody: "Sealed" },
  { id: "EV-2843", name: "incident_timeline.md", type: "Document", size: "28 KB", sealed: "4h ago", hash: "c7b2...1e9f", custody: "Transferred" },
  { id: "EV-2842", name: "malware_sample_x47.bin", type: "Binary", size: "847 KB", sealed: "6h ago", hash: "e4d8...3a5b", custody: "Sealed" },
];

export interface HuntResult {
  hits: HuntHit[];
  byCorpus: Record<HuntCorpus, number>;
  ranAt: number;
  query: string;
}

export const runHunt = (query: string, corpora: HuntCorpus[]): HuntResult => {
  const tokens = tokenize(query);
  const hits: HuntHit[] = [];

  if (tokens.length) {
    if (corpora.includes("vault")) hits.push(...vaultHits(tokens));

    if (corpora.includes("ioc")) {
      getIocs().forEach((i) => {
        const score = scoreOf(`${i.value} ${i.type} ${i.severity} ${i.source} ${i.tags.join(" ")}`, tokens);
        if (score) hits.push({ id: i.id, corpus: "ioc", title: i.value, detail: `${i.type.toUpperCase()} · ${i.severity} · ${i.hits} hits · ${i.source}`, at: i.firstSeen, score, meta: { tags: i.tags } });
      });
    }

    if (corpora.includes("incident")) {
      getIncidents().forEach((i) => {
        const score = scoreOf(`${i.title} ${i.id} ${i.severity} ${i.status} ${i.owner} ${i.source} ${i.notes.join(" ")}`, tokens);
        if (score) hits.push({ id: i.id, corpus: "incident", title: i.title, detail: `${i.severity} · ${i.status} · owner ${i.owner}`, at: i.createdAt, score });
      });
    }

    if (corpora.includes("audit")) {
      getEntries().forEach((e) => {
        const score = scoreOf(`${e.action} ${e.subject} ${e.summary} ${e.domain} ${e.actor}`, tokens);
        if (score) hits.push({ id: e.id, corpus: "audit", title: e.summary, detail: `${e.domain} · ${e.action} · ${e.actor}`, at: e.at, score, meta: { digest: e.digest } });
      });
    }
  }

  hits.sort((a, b) => b.score - a.score || (b.at ?? 0) - (a.at ?? 0));

  const byCorpus: Record<HuntCorpus, number> = { vault: 0, ioc: 0, incident: 0, audit: 0 };
  hits.forEach((h) => { byCorpus[h.corpus] += 1; });

  const result: HuntResult = { hits, byCorpus, ranAt: Date.now(), query };

  queries = queries.map((q) => (q.query === query ? { ...q, lastRun: result.ranAt, lastHits: hits.length } : q));
  emitQ();

  bus.emit("telemetry.received", {
    source: "Hunt Workbench",
    type: "hunt.executed",
    severity: hits.length > 8 ? "High" : "Info",
    message: `Hunt "${query}" matched ${hits.length} artifacts across ${corpora.join("/")}`,
    at: result.ranAt,
  });

  logAudit({
    domain: "vault", action: "hunt.executed", subject: query.slice(0, 40) || "empty",
    summary: `Hunt executed — ${hits.length} hits across ${corpora.join(", ")}`,
    meta: { byCorpus },
  });

  return result;
};
