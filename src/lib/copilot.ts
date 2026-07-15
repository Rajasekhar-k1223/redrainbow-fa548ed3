// RedRainbow — Client-side Copilot heuristic engine.
// Deterministic, offline, rule-based "AI" reasoning over live cockpit state.
// Backend swap: replace `runCopilot` with a call to Lovable AI Gateway later.

import { getIncidents, getIocs, type Incident, type IOC } from "./incidentStore";
import { getPublished } from "./vaultStore";
import { bus } from "./eventBus";

export type CopilotRole = "user" | "copilot" | "system";
export interface CopilotMessage {
  id: string;
  role: CopilotRole;
  content: string;
  at: number;
  actions?: CopilotAction[];
}
export interface CopilotAction {
  label: string;
  route?: string;
  event?: keyof typeof bus & string;
}

export interface CopilotInsight {
  id: string;
  title: string;
  detail: string;
  severity: "Critical" | "High" | "Medium" | "Low" | "Info";
  route?: string;
}

let recentSignals: { id: string; type: string; severity: string; source: string; at: number }[] = [];
bus.on("signal.created", (p) => {
  recentSignals = [{ id: p.id, type: p.type, severity: p.severity, source: p.source, at: Date.now() }, ...recentSignals].slice(0, 40);
});

export const getRecentSignals = () => recentSignals;

// ---------- Insight synthesis ---------------------------------------------

export function synthesizeInsights(): CopilotInsight[] {
  const incidents = getIncidents();
  const iocs = getIocs();
  const vault = getPublished();
  const out: CopilotInsight[] = [];

  const critical = incidents.filter((i: Incident) => i.severity === "Critical" && i.status !== "Closed");
  if (critical.length) {
    out.push({
      id: "ins-crit-inc",
      title: `${critical.length} critical incident${critical.length > 1 ? "s" : ""} open`,
      detail: `Highest priority: ${critical[0].title}. Owner ${critical[0].owner}. Recommend containment + memory capture.`,
      severity: "Critical", route: "/dashboard/incidents",
    });
  }

  const unassigned = incidents.filter((i: Incident) => i.owner === "unassigned" && i.status === "Open");
  if (unassigned.length) {
    out.push({
      id: "ins-unassigned",
      title: `${unassigned.length} incident${unassigned.length > 1 ? "s" : ""} unassigned`,
      detail: "Auto-created from Signal Mesh events. Assign an operator to begin triage.",
      severity: "High", route: "/dashboard/incidents",
    });
  }

  const c2iocs = iocs.filter((i: IOC) => i.tags.includes("c2"));
  if (c2iocs.length) {
    out.push({
      id: "ins-c2",
      title: `${c2iocs.length} C2 indicator${c2iocs.length > 1 ? "s" : ""} in ledger`,
      detail: `Push to WAF + DNS sinkhole. Top hit: ${c2iocs[0].value} (${c2iocs[0].hits} hits).`,
      severity: "Critical", route: "/dashboard/iocs",
    });
  }

  const recentHigh = recentSignals.filter((s) => (s.severity === "Critical" || s.severity === "High") && Date.now() - s.at < 10 * 60_000);
  if (recentHigh.length >= 3) {
    out.push({
      id: "ins-storm",
      title: "Signal storm detected",
      detail: `${recentHigh.length} high/critical signals in the last 10 minutes — consider raising cockpit posture and locking non-essential integrations.`,
      severity: "High", route: "/dashboard/signals",
    });
  }

  if (vault.length < 5) {
    out.push({
      id: "ins-vault",
      title: "Evidence sparse",
      detail: "Vault contains fewer than 5 sealed artifacts. Seal recent scan outputs to preserve chain of custody.",
      severity: "Low", route: "/dashboard/vault",
    });
  } else {
    out.push({
      id: "ins-vault-ok",
      title: `Evidence Vault healthy · ${vault.length} artifacts`,
      detail: "Chain of custody intact. Consider generating an executive report.",
      severity: "Info", route: "/dashboard/reports",
    });
  }

  return out;
}

// ---------- Chat brain (rule-based, deterministic) ------------------------

export function runCopilot(query: string): CopilotMessage {
  const q = query.toLowerCase().trim();
  const at = Date.now();
  const id = `cop-${at}-${Math.random().toString(36).slice(2, 6)}`;
  const mk = (content: string, actions?: CopilotAction[]): CopilotMessage => ({ id, role: "copilot", content, at, actions });

  if (!q) return mk("Ask me about incidents, IOCs, signals, or type 'status' for a cockpit summary.");

  if (/\b(status|summary|overview|report)\b/.test(q)) {
    const inc = getIncidents();
    const iocs = getIocs();
    const open = inc.filter((i) => i.status !== "Closed").length;
    const crit = inc.filter((i) => i.severity === "Critical" && i.status !== "Closed").length;
    return mk(
      `Cockpit status:\n· ${inc.length} tracked incidents (${open} open, ${crit} critical)\n· ${iocs.length} IOCs in ledger\n· ${recentSignals.length} signals in short-term memory\n· Vault: ${getPublished().length} sealed artifacts`,
      [{ label: "Open Incidents", route: "/dashboard/incidents" }, { label: "Generate Report", route: "/dashboard/reports" }],
    );
  }

  if (/\b(incident|breach|compromise)\b/.test(q)) {
    const inc = getIncidents().filter((i) => i.status !== "Closed").slice(0, 3);
    if (!inc.length) return mk("No open incidents. Cockpit is quiet.");
    return mk(
      "Top open incidents:\n" + inc.map((i) => `· [${i.severity}] ${i.id} — ${i.title} (owner: ${i.owner})`).join("\n"),
      [{ label: "Go to Incidents", route: "/dashboard/incidents" }],
    );
  }

  if (/\b(ioc|indicator|c2|malware|hash|ip|domain)\b/.test(q)) {
    const iocs = getIocs().slice(0, 4);
    if (!iocs.length) return mk("IOC ledger is empty.");
    return mk(
      "Recent IOCs:\n" + iocs.map((i) => `· [${i.severity}] ${i.type}: ${i.value} (${i.hits} hits) — ${i.tags.join(", ") || "no tags"}`).join("\n"),
      [{ label: "Open IOC Ledger", route: "/dashboard/iocs" }],
    );
  }

  if (/\b(signal|mesh|feed|alert)\b/.test(q)) {
    const s = recentSignals.slice(0, 5);
    if (!s.length) return mk("No signals observed since page load. Run an asset scan to populate the mesh.");
    return mk(
      "Recent signals:\n" + s.map((x) => `· [${x.severity}] ${x.source} → ${x.type}`).join("\n"),
      [{ label: "Open Signal Mesh", route: "/dashboard/signals" }],
    );
  }

  if (/\b(recommend|next|action|do|priorit)/.test(q)) {
    const ins = synthesizeInsights().slice(0, 3);
    if (!ins.length) return mk("No urgent recommendations — cockpit is stable.");
    return mk(
      "Prioritized recommendations:\n" + ins.map((i, n) => `${n + 1}. [${i.severity}] ${i.title} — ${i.detail}`).join("\n"),
    );
  }

  if (/\b(scan|hunt|recon)\b/.test(q)) {
    return mk("Trigger scans from the Assets page. High-value targets right now: production edge, cloud posture drift, exposed RDP/SMB.", [
      { label: "Go to Assets", route: "/dashboard/assets" },
    ]);
  }

  if (/\b(vuln|cve|patch)\b/.test(q)) {
    return mk("Focus on Critical/High CVEs with public exploits. Sort by CVSS in the Vulnerabilities module.", [
      { label: "Vulnerabilities", route: "/dashboard/vulnerabilities" },
    ]);
  }

  if (/\b(help|what can|commands?)\b/.test(q)) {
    return mk("Try: 'status', 'show incidents', 'recent IOCs', 'signal storm?', 'recommend next action', 'vulnerabilities', 'seal evidence', 'launch mission'.");
  }

  if (/\b(seal|vault|evidence)\b/.test(q)) {
    return mk("Every closed incident and generated report is auto-sealed into the Evidence Vault with an integrity hash.", [
      { label: "Open Vault", route: "/dashboard/vault" },
    ]);
  }

  if (/\b(mission|drill|red team|blue team|purple)\b/.test(q)) {
    return mk("Missions auto-suggest from Critical/High signals. Launch them from the Missions page.", [
      { label: "Missions", route: "/dashboard/missions" },
    ]);
  }

  return mk(
    `I parsed "${query}" but didn't match a playbook. Try asking about status, incidents, IOCs, signals, or recommendations.`,
  );
}
