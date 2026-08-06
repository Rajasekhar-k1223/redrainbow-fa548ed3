// ---------------------------------------------------------------------------
// RedRainbow — Attack Surface Drift & Change Detection
// Keeps versioned snapshots of the external/internal attack surface
// (subdomains, open ports, TLS certificates, cloud assets) and diffs them to
// produce drift events. Persisted to localStorage; emits bus events so
// Signals / Telemetry / Notifications react to surface changes.
// ---------------------------------------------------------------------------

import { bus, busIds, type Severity } from "@/lib/eventBus";
import { logAudit } from "@/lib/auditStore";

export type SurfaceKind = "subdomain" | "port" | "certificate" | "cloud";
export type DriftType = "added" | "removed" | "changed";

export interface SurfaceEntity {
  key: string;            // stable identity, e.g. "port:bastion-mgmt-02:23"
  kind: SurfaceKind;
  label: string;          // human readable
  detail: string;         // service / issuer / region
  fingerprint: string;    // changes when the entity mutates
}

export interface Snapshot {
  id: string;
  at: number;
  entities: SurfaceEntity[];
}

export interface DriftEvent {
  id: string;
  at: number;
  kind: SurfaceKind;
  type: DriftType;
  label: string;
  detail: string;
  severity: Severity;
  before?: string;
  after?: string;
  acknowledged?: boolean;
}

const SNAP_KEY = "rr.surface.snapshots";
const DRIFT_KEY = "rr.surface.drift";
const MAX_SNAPSHOTS = 12;
const MAX_DRIFT = 300;

let snapshots: Snapshot[] = [];
let drift: DriftEvent[] = [];
let counter = 1;

const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());

const persist = () => {
  try {
    localStorage.setItem(SNAP_KEY, JSON.stringify(snapshots));
    localStorage.setItem(DRIFT_KEY, JSON.stringify(drift));
  } catch { /* quota / private mode */ }
};

const hydrate = () => {
  try {
    const s = localStorage.getItem(SNAP_KEY);
    const d = localStorage.getItem(DRIFT_KEY);
    if (s) snapshots = JSON.parse(s) as Snapshot[];
    if (d) drift = JSON.parse(d) as DriftEvent[];
    counter = drift.length + 1;
  } catch { /* ignore */ }
};
hydrate();

// ---------- baseline surface --------------------------------------------------

const ent = (kind: SurfaceKind, label: string, detail: string, fp: string): SurfaceEntity => ({
  key: `${kind}:${label}`,
  kind, label, detail, fingerprint: fp,
});

const baseline = (): SurfaceEntity[] => [
  ent("subdomain", "api.redrain.sec", "A → 203.0.113.19", "203.0.113.19"),
  ent("subdomain", "vault.redrain.sec", "A → 203.0.113.24", "203.0.113.24"),
  ent("subdomain", "dev.redrain.sec", "A → 198.51.100.7", "198.51.100.7"),
  ent("port", "edge-gateway-07:443", "https / nginx 1.25", "nginx-1.25"),
  ent("port", "edge-gateway-07:22", "ssh / OpenSSH 9.6", "openssh-9.6"),
  ent("port", "bastion-mgmt-02:22", "ssh / OpenSSH 9.3", "openssh-9.3"),
  ent("certificate", "api.redrain.sec", "LetsEncrypt R3 · exp 2026-11-04", "exp-2026-11-04"),
  ent("certificate", "vault.redrain.sec", "DigiCert G2 · exp 2027-01-22", "exp-2027-01-22"),
  ent("cloud", "aws-prod-account-1138", "eu-west-1 · 42 resources", "res-42"),
  ent("cloud", "gcp-analytics-pool", "europe-north1 · 17 resources", "res-17"),
];

// ---------- mutation generator (simulates real-world surface change) ---------

const pick = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];

const mutate = (entities: SurfaceEntity[]): SurfaceEntity[] => {
  const next = entities.map((e) => ({ ...e }));

  // possible additions
  const candidates: SurfaceEntity[] = [
    ent("subdomain", `staging-${Math.floor(Math.random() * 90) + 10}.redrain.sec`, "A → 198.51.100.44", "198.51.100.44"),
    ent("port", `bastion-mgmt-02:${pick([23, 3389, 5900, 8080])}`, "unexpected service exposed", "unverified"),
    ent("cloud", `aws-lab-account-${Math.floor(Math.random() * 900) + 100}`, "us-east-1 · 6 resources", "res-6"),
    ent("certificate", `edge-${Math.floor(Math.random() * 90) + 10}.redrain.sec`, "Self-signed · exp 2026-09-01", "self-signed"),
  ];
  const additions = candidates.filter(() => Math.random() < 0.5).slice(0, 2);
  additions.forEach((a) => { if (!next.some((n) => n.key === a.key)) next.push(a); });

  // possible change
  if (Math.random() < 0.7 && next.length) {
    const target = pick(next.filter((n) => n.kind !== "cloud")) ?? next[0];
    target.fingerprint = `${target.fingerprint}-r${Math.floor(Math.random() * 9) + 1}`;
    target.detail = target.kind === "certificate"
      ? `${target.detail.split(" · ")[0]} · exp ${2026 + Math.floor(Math.random() * 2)}-0${Math.floor(Math.random() * 8) + 1}-1${Math.floor(Math.random() * 9)}`
      : `${target.detail} (rotated)`;
  }

  // possible removal (never remove the whole surface)
  if (Math.random() < 0.4 && next.length > 6) {
    const idx = Math.floor(Math.random() * next.length);
    next.splice(idx, 1);
  }

  return next;
};

// ---------- severity heuristics ---------------------------------------------

const severityFor = (kind: SurfaceKind, type: DriftType, detail: string): Severity => {
  if (detail.includes("unexpected") || detail.includes("self-signed") || detail.includes("Self-signed")) return "Critical";
  if (type === "added" && (kind === "port" || kind === "cloud")) return "High";
  if (type === "removed" && kind === "certificate") return "High";
  if (type === "changed" && kind === "certificate") return "Medium";
  if (type === "added" && kind === "subdomain") return "Medium";
  return "Low";
};

// ---------- public API -------------------------------------------------------

export const getSnapshots = () => snapshots;
export const getDrift = () => drift;
export const getCurrentSurface = (): SurfaceEntity[] => snapshots[0]?.entities ?? baseline();

export const subscribeDrift = (cb: () => void) => {
  listeners.add(cb);
  cb();
  return () => { listeners.delete(cb); };
};

const pushDrift = (events: Omit<DriftEvent, "id">[]) => {
  const created = events.map((e) => ({ ...e, id: `DRF-${String(counter++).padStart(4, "0")}` }));
  drift = [...created, ...drift].slice(0, MAX_DRIFT);
  return created;
};

/** Diff two entity sets into drift events. */
export const diffSurface = (prev: SurfaceEntity[], next: SurfaceEntity[], at = Date.now()): Omit<DriftEvent, "id">[] => {
  const prevMap = new Map(prev.map((e) => [e.key, e]));
  const nextMap = new Map(next.map((e) => [e.key, e]));
  const events: Omit<DriftEvent, "id">[] = [];

  for (const [key, e] of nextMap) {
    const before = prevMap.get(key);
    if (!before) {
      events.push({ at, kind: e.kind, type: "added", label: e.label, detail: e.detail, severity: severityFor(e.kind, "added", e.detail) });
    } else if (before.fingerprint !== e.fingerprint) {
      events.push({ at, kind: e.kind, type: "changed", label: e.label, detail: e.detail, severity: severityFor(e.kind, "changed", e.detail), before: before.fingerprint, after: e.fingerprint });
    }
  }
  for (const [key, e] of prevMap) {
    if (!nextMap.has(key)) {
      events.push({ at, kind: e.kind, type: "removed", label: e.label, detail: e.detail, severity: severityFor(e.kind, "removed", e.detail) });
    }
  }
  return events;
};

/** Capture the first baseline snapshot (no drift produced). */
export const captureBaseline = () => {
  const snap: Snapshot = { id: `SNP-${snapshots.length + 1}`.padEnd(5, ""), at: Date.now(), entities: baseline() };
  snapshots = [snap, ...snapshots].slice(0, MAX_SNAPSHOTS);
  persist();
  notify();
  bus.emit("telemetry.received", { source: "Surface Monitor", type: "baseline", message: `Attack surface baseline captured — ${snap.entities.length} entities`, severity: "Info", at: snap.at });
  logAudit({ domain: "vault", action: "surface.baseline", subject: snap.id, summary: `Attack surface baseline captured (${snap.entities.length} entities)` });
  return snap;
};

/**
 * Run a surface sweep: mutate current surface, diff against the last snapshot,
 * store the new snapshot and cascade drift events onto the bus.
 */
export const runSurfaceSweep = () => {
  if (!snapshots.length) captureBaseline();
  const prev = snapshots[0].entities;
  const next = mutate(prev);
  const at = Date.now();
  const events = diffSurface(prev, next, at);

  const snap: Snapshot = { id: `SNP-${snapshots.length + 1}`, at, entities: next };
  snapshots = [snap, ...snapshots].slice(0, MAX_SNAPSHOTS);
  const created = pushDrift(events);
  persist();
  notify();

  // Cascade into the rest of the cockpit
  for (const e of created) {
    bus.emit("telemetry.received", {
      source: "Surface Monitor",
      type: `drift.${e.type}`,
      message: `${e.kind} ${e.type}: ${e.label} — ${e.detail}`,
      severity: e.severity,
      at: e.at,
    });
    if (e.severity === "Critical" || e.severity === "High") {
      bus.emit("signal.created", {
        id: busIds.signal(),
        source: "Surface Monitor",
        type: `Attack surface drift (${e.type})`,
        severity: e.severity,
        count: 1,
        cause: "asset.scan.completed",
      });
      if (e.type === "added" && e.detail.includes("unexpected")) {
        bus.emit("vulnerability.detected", {
          id: busIds.vuln(),
          title: `Unexpected exposure on ${e.label}`,
          asset: e.label.split(":")[0],
          severity: e.severity,
          cvss: "8.4",
        });
      }
    }
    if (e.type === "added" && e.kind === "subdomain") {
      bus.emit("asset.discovered", { assetId: `AST-${Math.floor(Math.random() * 900) + 100}`, identifier: e.label, type: "Domain", env: "Prod", criticality: e.severity });
    }
  }

  bus.emit("notification.created", {
    level: created.some((e) => e.severity === "Critical") ? "error" : created.length ? "warn" : "success",
    title: created.length ? `${created.length} attack surface changes detected` : "No attack surface drift",
    detail: created.length ? created.slice(0, 3).map((e) => `${e.type}: ${e.label}`).join(" · ") : "Surface matches previous snapshot.",
  });

  logAudit({
    domain: "vault",
    action: "surface.sweep",
    subject: snap.id,
    summary: `Surface sweep produced ${created.length} drift event(s)`,
    meta: { added: created.filter((e) => e.type === "added").length, removed: created.filter((e) => e.type === "removed").length, changed: created.filter((e) => e.type === "changed").length },
  });

  return created;
};

export const acknowledgeDrift = (id: string) => {
  drift = drift.map((d) => (d.id === id ? { ...d, acknowledged: true } : d));
  persist();
  notify();
  logAudit({ domain: "vault", action: "surface.acknowledged", subject: id, summary: `Drift event ${id} acknowledged` });
};

export const clearDrift = () => {
  drift = [];
  snapshots = [];
  persist();
  notify();
};

export const driftCsv = (subset: DriftEvent[] = drift) => {
  const rows = [
    ["id", "detected_at", "kind", "type", "label", "detail", "severity", "acknowledged"],
    ...subset.map((d) => [d.id, new Date(d.at).toISOString(), d.kind, d.type, d.label, d.detail, d.severity, d.acknowledged ? "yes" : "no"]),
  ];
  return rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
};

export const downloadDriftCsv = (subset?: DriftEvent[]) => {
  const blob = new Blob([driftCsv(subset)], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `redrainbow-surface-drift-${Date.now()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};

/** Auto-record drift when other modules discover new surface. */
export const wireDriftBus = () => {
  bus.on("port.discovered", (p) => {
    const created = pushDrift([{
      at: Date.now(),
      kind: "port",
      type: "added",
      label: `${p.host}:${p.port}`,
      detail: p.unexpected ? `unexpected service exposed (${p.service})` : `${p.service}`,
      severity: p.unexpected ? "Critical" : "Low",
    }]);
    persist();
    notify();
    return created;
  });

  bus.on("asset.discovered", (a) => {
    pushDrift([{
      at: Date.now(),
      kind: a.type === "Cloud" ? "cloud" : "subdomain",
      type: "added",
      label: a.identifier,
      detail: `${a.type} · ${a.env}`,
      severity: a.criticality,
    }]);
    persist();
    notify();
  });
};
