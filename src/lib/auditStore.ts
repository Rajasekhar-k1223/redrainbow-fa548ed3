// ---------------------------------------------------------------------------
// RedRainbow — Append-only Audit Ledger
// Records every vault, incident, and mission action as an immutable entry with
// a synthetic integrity digest. Persisted to localStorage; downloadable as
// signed-style JSON evidence for chain-of-custody review.
// ---------------------------------------------------------------------------

import { bus } from "./eventBus";

export type AuditDomain = "vault" | "incident" | "mission" | "response";

export interface AuditEntry {
  id: string;
  at: number;
  domain: AuditDomain;
  action: string;
  subject: string;          // INC-1043 / EV-2849 / M-047
  actor: string;
  summary: string;
  digest: string;
  meta?: Record<string, unknown>;
}

const STORAGE_KEY = "redrainbow.audit.v1";
const COUNTER_KEY = "redrainbow.audit.counter.v1";
const MAX_ENTRIES = 500;

const listeners = new Set<(entries: AuditEntry[]) => void>();

const load = (): { entries: AuditEntry[]; counter: number } => {
  if (typeof window === "undefined") return { entries: [], counter: 1 };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const rawC = window.localStorage.getItem(COUNTER_KEY);
    const entries = raw ? (JSON.parse(raw) as AuditEntry[]) : [];
    return {
      entries: Array.isArray(entries) ? entries : [],
      counter: rawC ? Number(rawC) || 1 : 1,
    };
  } catch {
    return { entries: [], counter: 1 };
  }
};

const initial = load();
let entries: AuditEntry[] = initial.entries;
let counter = initial.counter;

const persist = () => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries.slice(0, MAX_ENTRIES)));
    window.localStorage.setItem(COUNTER_KEY, String(counter));
  } catch {
    /* quota / private mode — ignore */
  }
};

// Deterministic FNV-1a digest over the entry body + previous digest, giving the
// ledger a tamper-evident chain without a crypto dependency.
const digestOf = (input: string): string => {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, "0");
};

const currentActor = (): string => {
  if (typeof window === "undefined") return "system";
  try {
    const raw = window.localStorage.getItem("redrainbow.settings.v1");
    if (raw) {
      const parsed = JSON.parse(raw) as { activeOperator?: string; operator?: string; role?: string };
      return parsed.activeOperator ?? parsed.operator ?? parsed.role ?? "ghost.7";
    }
  } catch { /* ignore */ }
  return "ghost.7";
};

export const logAudit = (input: {
  domain: AuditDomain;
  action: string;
  subject: string;
  summary: string;
  actor?: string;
  meta?: Record<string, unknown>;
}): AuditEntry => {
  const at = Date.now();
  const prev = entries[0]?.digest ?? "genesis";
  const entry: AuditEntry = {
    id: `AUD-${String(counter++).padStart(5, "0")}`,
    at,
    domain: input.domain,
    action: input.action,
    subject: input.subject,
    actor: input.actor ?? currentActor(),
    summary: input.summary,
    digest: `${digestOf(`${prev}|${at}|${input.domain}|${input.action}|${input.subject}|${input.summary}`)}`,
    meta: input.meta,
  };
  entries = [entry, ...entries].slice(0, MAX_ENTRIES);
  persist();
  listeners.forEach((l) => l(entries));
  return entry;
};

export const getAudit = () => entries;

export const subscribeAudit = (cb: (entries: AuditEntry[]) => void) => {
  listeners.add(cb);
  cb(entries);
  return () => { listeners.delete(cb); };
};

export const clearAudit = () => {
  entries = [];
  persist();
  listeners.forEach((l) => l(entries));
};

// ---------- Downloadable JSON evidence -------------------------------------

export const buildAuditEvidence = (subset: AuditEntry[] = entries) => ({
  ledger: "RedRainbowCommandLayer.audit",
  version: 1,
  generatedAt: new Date().toISOString(),
  entryCount: subset.length,
  chainHead: subset[0]?.digest ?? "genesis",
  entries: subset.map((e) => ({
    ...e,
    timestamp: new Date(e.at).toISOString(),
  })),
});

export const downloadAuditEvidence = (subset?: AuditEntry[], filename?: string) => {
  const payload = buildAuditEvidence(subset);
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename ?? `audit-ledger-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, "")}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  return payload;
};

// ---------- Bus wiring ------------------------------------------------------

let wired = false;
export const wireAuditBus = () => {
  if (wired) return; wired = true;

  bus.on("vault.saved", (p) => {
    logAudit({
      domain: "vault",
      action: "evidence.sealed",
      subject: p.id,
      summary: `Sealed "${p.name}" (${p.type}, ${p.size}) hash ${p.hash}`,
      meta: { source: p.source, hash: p.hash },
    });
  });

  bus.on("mission.created", (p) => {
    logAudit({
      domain: "mission",
      action: "mission.created",
      subject: p.id,
      summary: `${p.type} mission "${p.name}" queued for ${p.team}`,
      meta: { origin: p.origin },
    });
  });

  bus.on("mission.started", (p) => {
    logAudit({
      domain: "mission",
      action: "mission.started",
      subject: p.id,
      summary: `Mission ${p.id} launched`,
    });
  });

  bus.on("mission.completed", (p) => {
    logAudit({
      domain: "mission",
      action: "mission.completed",
      subject: p.id,
      summary: `Mission ${p.id} completed — outcome ${p.outcome}`,
      meta: { outcome: p.outcome },
    });
  });
};
