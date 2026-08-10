// ---------------------------------------------------------------------------
// RedRainbow — SOAR Automated Response
// Curated response playbooks (isolate host, block IP, quarantine user, notify,
// open ticket…) executed step-by-step from the cockpit. Every run is persisted,
// streamed to Telemetry via the bus, sealed to the Evidence Vault, and written
// to the Audit Ledger.
//
// Backend swap: replace `simulateAction` with real connector calls (EDR API,
// firewall, IdP, Slack, Jira) while keeping the same run/step contracts.
// ---------------------------------------------------------------------------

import { bus, type Severity } from "@/lib/eventBus";
import { logAudit } from "@/lib/auditStore";
import { publishToVault } from "@/lib/vaultStore";

export type ActionKind =
  | "isolate-host"
  | "block-ip"
  | "quarantine-user"
  | "kill-process"
  | "revoke-token"
  | "snapshot-disk"
  | "notify-slack"
  | "open-ticket"
  | "enrich-intel"
  | "seal-evidence";

export type RunStatus = "queued" | "running" | "success" | "failed" | "requires-approval";

export interface PlaybookStep {
  action: ActionKind;
  label: string;
  target: string;
  /** Approval gate — run pauses here until an operator approves. */
  approval?: boolean;
}

export interface Playbook {
  id: string;
  name: string;
  category: "Containment" | "Eradication" | "Recovery" | "Notification";
  severity: Severity;
  trigger: string;
  description: string;
  steps: PlaybookStep[];
}

export interface StepResult {
  action: ActionKind;
  label: string;
  target: string;
  status: RunStatus;
  detail: string;
  at: number;
}

export interface PlaybookRun {
  id: string;
  playbookId: string;
  playbookName: string;
  status: RunStatus;
  startedAt: number;
  finishedAt?: number;
  origin?: string;
  operator: string;
  steps: StepResult[];
  pendingIndex?: number; // step awaiting approval
}

export const actionMeta: Record<ActionKind, { label: string; verb: string; connector: string }> = {
  "isolate-host":    { label: "Isolate host",       verb: "isolated",   connector: "EDR / CrowdStrike" },
  "block-ip":        { label: "Block IP",           verb: "blocked",    connector: "Edge Firewall" },
  "quarantine-user": { label: "Quarantine user",    verb: "quarantined", connector: "Identity Provider" },
  "kill-process":    { label: "Kill process",       verb: "terminated", connector: "EDR / OSQuery" },
  "revoke-token":    { label: "Revoke sessions",    verb: "revoked",    connector: "Identity Provider" },
  "snapshot-disk":   { label: "Snapshot disk",      verb: "captured",   connector: "Hypervisor" },
  "notify-slack":    { label: "Notify channel",     verb: "notified",   connector: "Slack / Teams" },
  "open-ticket":     { label: "Open ticket",        verb: "filed",      connector: "Jira / ServiceNow" },
  "enrich-intel":    { label: "Enrich indicator",   verb: "enriched",   connector: "Threat Intel Feeds" },
  "seal-evidence":   { label: "Seal evidence",      verb: "sealed",     connector: "Evidence Vault" },
};

export const playbooks: Playbook[] = [
  {
    id: "PB-CONTAIN-01",
    name: "Ransomware Containment",
    category: "Containment",
    severity: "Critical",
    trigger: "signal.severity = Critical AND type ~ encryption",
    description: "Isolates the affected endpoint, kills the offending process, snapshots the disk for forensics and pages the on-call cell.",
    steps: [
      { action: "isolate-host",  label: "Isolate endpoint",         target: "Qubes-01" },
      { action: "kill-process",  label: "Kill encryptor process",   target: "svc_enc.exe" },
      { action: "snapshot-disk", label: "Snapshot disk for IR",     target: "Qubes-01:/dev/sda" },
      { action: "notify-slack",  label: "Page #ir-warroom",         target: "#ir-warroom" },
      { action: "seal-evidence", label: "Seal response transcript", target: "Evidence Vault" },
    ],
  },
  {
    id: "PB-CONTAIN-02",
    name: "Malicious IP Blockade",
    category: "Containment",
    severity: "High",
    trigger: "ioc.verdict = Malicious AND type = ip",
    description: "Enriches the indicator, pushes a deny rule to the edge firewall and records the block for audit.",
    steps: [
      { action: "enrich-intel",  label: "Enrich indicator",         target: "185.220.101.42" },
      { action: "block-ip",      label: "Push deny rule to edge",   target: "185.220.101.42", approval: true },
      { action: "open-ticket",   label: "File change record",       target: "SEC-CHG" },
      { action: "seal-evidence", label: "Seal response transcript", target: "Evidence Vault" },
    ],
  },
  {
    id: "PB-ERAD-01",
    name: "Compromised Account Lockdown",
    category: "Eradication",
    severity: "High",
    trigger: "signal.type = impossible-travel OR credential-stuffing",
    description: "Revokes all live sessions, quarantines the identity and notifies the account owner's manager.",
    steps: [
      { action: "revoke-token",     label: "Revoke active sessions", target: "user:ghost.7" },
      { action: "quarantine-user",  label: "Quarantine identity",    target: "user:ghost.7", approval: true },
      { action: "notify-slack",     label: "Notify #identity-ops",   target: "#identity-ops" },
      { action: "seal-evidence",    label: "Seal response transcript", target: "Evidence Vault" },
    ],
  },
  {
    id: "PB-ERAD-02",
    name: "Exposed Service Takedown",
    category: "Eradication",
    severity: "Medium",
    trigger: "drift.type = added AND kind = port",
    description: "Closes an unexpected exposed port, files a change ticket and confirms the surface is back to baseline.",
    steps: [
      { action: "block-ip",      label: "Close exposed port at edge", target: "bastion-mgmt-02:23" },
      { action: "open-ticket",   label: "File remediation ticket",    target: "SEC-REM" },
      { action: "seal-evidence", label: "Seal response transcript",   target: "Evidence Vault" },
    ],
  },
  {
    id: "PB-NOTIFY-01",
    name: "Executive Breach Notification",
    category: "Notification",
    severity: "Critical",
    trigger: "incident.status = Contained AND severity = Critical",
    description: "Publishes a stakeholder brief, files a regulatory tracking ticket and seals the notification record.",
    steps: [
      { action: "notify-slack",   label: "Post exec brief",        target: "#exec-brief", approval: true },
      { action: "open-ticket",    label: "Open regulatory tracker", target: "GRC-NOTIF" },
      { action: "seal-evidence",  label: "Seal notification record", target: "Evidence Vault" },
    ],
  },
  {
    id: "PB-RECOV-01",
    name: "Host Restore & Re-attest",
    category: "Recovery",
    severity: "Medium",
    trigger: "manual",
    description: "Lifts isolation after verification, re-attests the node and closes the response loop.",
    steps: [
      { action: "snapshot-disk", label: "Capture post-IR image",   target: "SecOnion-02" },
      { action: "isolate-host",  label: "Lift isolation",          target: "SecOnion-02", approval: true },
      { action: "notify-slack",  label: "Confirm restore",         target: "#blue-team" },
      { action: "seal-evidence", label: "Seal response transcript", target: "Evidence Vault" },
    ],
  },
];

// ---------- Store -----------------------------------------------------------

const RUNS_KEY = "redrainbow.soar.runs.v1";
const MAX_RUNS = 60;

let runs: PlaybookRun[] = load();
let counter = runs.length + 1;
const listeners = new Set<(r: PlaybookRun[]) => void>();

function load(): PlaybookRun[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(RUNS_KEY);
    const parsed = raw ? (JSON.parse(raw) as PlaybookRun[]) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch { return []; }
}

const persist = () => {
  try { window.localStorage.setItem(RUNS_KEY, JSON.stringify(runs.slice(0, MAX_RUNS))); }
  catch { /* quota / private mode */ }
};

const notify = () => { persist(); listeners.forEach((l) => l(runs)); };

export const getRuns = () => runs;

export const subscribeRuns = (cb: (r: PlaybookRun[]) => void) => {
  listeners.add(cb);
  cb(runs);
  return () => { listeners.delete(cb); };
};

export const clearRuns = () => { runs = []; notify(); };

const patchRun = (id: string, patch: Partial<PlaybookRun>) => {
  runs = runs.map((r) => (r.id === id ? { ...r, ...patch } : r));
  notify();
};

const wait = (ms: number) => new Promise((res) => setTimeout(res, ms));

/** Deterministic-ish simulated connector result. */
const simulateAction = (step: PlaybookStep): { ok: boolean; detail: string } => {
  const meta = actionMeta[step.action];
  const ok = Math.random() > 0.08;
  return ok
    ? { ok, detail: `${meta.connector} → ${step.target} ${meta.verb}` }
    : { ok, detail: `${meta.connector} rejected the request for ${step.target} (retry required)` };
};

// ---------- Execution -------------------------------------------------------

export const startRun = (playbookId: string, opts?: { origin?: string; operator?: string }): PlaybookRun | null => {
  const pb = playbooks.find((p) => p.id === playbookId);
  if (!pb) return null;

  const run: PlaybookRun = {
    id: `RUN-${String(counter++).padStart(4, "0")}`,
    playbookId: pb.id,
    playbookName: pb.name,
    status: "running",
    startedAt: Date.now(),
    operator: opts?.operator ?? "ghost.7",
    origin: opts?.origin,
    steps: pb.steps.map((s) => ({
      action: s.action, label: s.label, target: s.target,
      status: "queued" as RunStatus, detail: "waiting", at: 0,
    })),
  };

  runs = [run, ...runs].slice(0, MAX_RUNS);
  notify();

  logAudit({
    domain: "response",
    action: "playbook.started",
    subject: run.id,
    summary: `Response playbook "${pb.name}" started (${pb.steps.length} actions)`,
    actor: run.operator,
    meta: { playbookId: pb.id, origin: opts?.origin, severity: pb.severity },
  });

  bus.emit("telemetry.received", {
    source: "SOAR", type: "playbook.started",
    message: `${pb.name} → ${run.id}`, severity: pb.severity, at: Date.now(),
  });

  void execute(run.id, 0);
  return run;
};

/** Approve a paused step and continue the run. */
export const approveStep = (runId: string) => {
  const run = runs.find((r) => r.id === runId);
  if (!run || run.status !== "requires-approval" || run.pendingIndex === undefined) return;
  const idx = run.pendingIndex;
  logAudit({
    domain: "response",
    action: "playbook.approved",
    subject: run.id,
    summary: `Operator approved "${run.steps[idx].label}" on ${run.steps[idx].target}`,
    actor: run.operator,
  });
  patchRun(runId, { status: "running", pendingIndex: undefined });
  void execute(runId, idx, true);
};

/** Abort a paused or running playbook. */
export const abortRun = (runId: string) => {
  const run = runs.find((r) => r.id === runId);
  if (!run || run.status === "success" || run.status === "failed") return;
  const steps = run.steps.map((s) =>
    s.status === "queued" || s.status === "requires-approval"
      ? { ...s, status: "failed" as RunStatus, detail: "aborted by operator", at: Date.now() }
      : s,
  );
  patchRun(runId, { status: "failed", steps, finishedAt: Date.now(), pendingIndex: undefined });
  logAudit({
    domain: "response",
    action: "playbook.aborted",
    subject: run.id,
    summary: `Response playbook "${run.playbookName}" aborted by operator`,
    actor: run.operator,
  });
  bus.emit("notification.created", {
    level: "warn", title: `${run.playbookName} aborted`, detail: run.id,
  });
};

async function execute(runId: string, fromIndex: number, approved = false) {
  const pb = playbooks.find((p) => p.id === runs.find((r) => r.id === runId)?.playbookId);
  if (!pb) return;

  for (let i = fromIndex; i < pb.steps.length; i++) {
    const current = runs.find((r) => r.id === runId);
    if (!current || current.status === "failed") return;

    const step = pb.steps[i];

    // Approval gate
    if (step.approval && !(approved && i === fromIndex)) {
      const steps = current.steps.map((s, idx) =>
        idx === i ? { ...s, status: "requires-approval" as RunStatus, detail: "awaiting operator approval", at: Date.now() } : s,
      );
      patchRun(runId, { status: "requires-approval", pendingIndex: i, steps });
      bus.emit("notification.created", {
        level: "warn",
        title: `Approval required — ${pb.name}`,
        detail: `${actionMeta[step.action].label} on ${step.target}`,
      });
      return;
    }

    // mark running
    patchRun(runId, {
      steps: (runs.find((r) => r.id === runId)!.steps).map((s, idx) =>
        idx === i ? { ...s, status: "running", detail: `dispatching via ${actionMeta[step.action].connector}`, at: Date.now() } : s,
      ),
    });

    await wait(600 + Math.random() * 700);

    const result = step.action === "seal-evidence" ? { ok: true, detail: "transcript sealed to Evidence Vault" } : simulateAction(step);

    patchRun(runId, {
      steps: (runs.find((r) => r.id === runId)!.steps).map((s, idx) =>
        idx === i ? { ...s, status: result.ok ? "success" : "failed", detail: result.detail, at: Date.now() } : s,
      ),
    });

    bus.emit("telemetry.received", {
      source: "SOAR", type: step.action,
      message: `${pb.name} · ${step.label} — ${result.detail}`,
      severity: result.ok ? "Info" : "High", at: Date.now(),
    });

    logAudit({
      domain: "response",
      action: `action.${step.action}`,
      subject: runId,
      summary: `${actionMeta[step.action].label} on ${step.target} — ${result.ok ? "success" : "failed"}: ${result.detail}`,
      meta: { playbookId: pb.id, step: i + 1 },
    });

    if (!result.ok) {
      patchRun(runId, { status: "failed", finishedAt: Date.now() });
      bus.emit("notification.created", {
        level: "error", title: `${pb.name} failed`, detail: `${step.label}: ${result.detail}`,
      });
      return;
    }
  }

  const finished = runs.find((r) => r.id === runId);
  patchRun(runId, { status: "success", finishedAt: Date.now() });

  if (finished) {
    const transcript = finished.steps
      .map((s, i) => `${i + 1}. [${new Date(s.at).toISOString()}] ${actionMeta[s.action].label} → ${s.target} :: ${s.status} — ${s.detail}`)
      .join("\n");
    publishToVault({
      name: `${runId}-${pb.id}-response.log`,
      type: "Response Log",
      size: `${Math.max(1, Math.round(transcript.length / 1024))} KB`,
      source: `SOAR/${pb.name}`,
      content: transcript,
    } as Parameters<typeof publishToVault>[0]);
  }

  bus.emit("notification.created", {
    level: "success", title: `${pb.name} completed`, detail: `${runId} · ${pb.steps.length} actions executed`,
  });
  bus.emit("compliance.updated", {
    deltaScore: 1,
    reason: `Automated response "${pb.name}" executed and evidence sealed`,
  });
}

// ---------- Bus wiring: auto-recommend / auto-run ---------------------------

let wired = false;
/** Auto-suggest a playbook whenever a critical signal or malicious drift lands. */
export const wireSoarBus = () => {
  if (wired) return; wired = true;

  bus.on("signal.created", (p) => {
    if (p.severity !== "Critical") return;
    bus.emit("notification.created", {
      level: "warn",
      title: "Response playbook recommended",
      detail: `${p.type} → Ransomware Containment (PB-CONTAIN-01)`,
    });
  });
};

export const recommendFor = (severity: Severity): Playbook =>
  playbooks.find((p) => p.severity === severity) ?? playbooks[0];
