// Incident + IOC store (client-only, localStorage-persisted).
// Reacts to bus events: high/critical signals auto-open incidents;
// port.discovered / vulnerability.detected feed the IOC ledger.

import { bus, type Severity } from "./eventBus";

export type IncidentStatus = "Open" | "Investigating" | "Contained" | "Closed";
export type IncidentSeverity = Severity;

export interface Incident {
  id: string;
  title: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  owner: string;
  source: string;
  createdAt: number;
  updatedAt: number;
  linkedSignals: string[];
  linkedIocs: string[];
  notes: string[];
}

export type IOCType = "ip" | "domain" | "hash" | "url" | "port";

export interface IOC {
  id: string;
  type: IOCType;
  value: string;
  severity: IncidentSeverity;
  source: string;
  firstSeen: number;
  hits: number;
  tags: string[];
}

const INC_KEY = "redrainbow.incidents.v1";
const IOC_KEY = "redrainbow.iocs.v1";

const load = <T>(k: string, fallback: T): T => {
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

// ------- seed data ---------------------------------------------------------

const seedIncidents: Incident[] = [
  {
    id: "INC-1042",
    title: "Suspicious C2 beacon from Qubes-01",
    severity: "Critical", status: "Investigating", owner: "ghost.7",
    source: "Signal Mesh", createdAt: Date.now() - 3600_000, updatedAt: Date.now() - 900_000,
    linkedSignals: ["SIG-10004"], linkedIocs: ["IOC-001", "IOC-002"],
    notes: ["Isolated host, capturing memory dump", "Escalated to blue team lead"],
  },
  {
    id: "INC-1041",
    title: "SQL injection attempts on api.acme.io",
    severity: "High", status: "Contained", owner: "wraith.2",
    source: "SECHub-03", createdAt: Date.now() - 7200_000, updatedAt: Date.now() - 1800_000,
    linkedSignals: ["SIG-10002"], linkedIocs: ["IOC-003"],
    notes: ["WAF rule deployed", "No data exfiltrated"],
  },
  {
    id: "INC-1040",
    title: "Unexpected RDP exposure on lab-vm-14",
    severity: "Medium", status: "Closed", owner: "specter.4",
    source: "Port scan", createdAt: Date.now() - 86400_000, updatedAt: Date.now() - 40000_000,
    linkedSignals: [], linkedIocs: [], notes: ["Port closed, image rebuilt"],
  },
];

const seedIocs: IOC[] = [
  { id: "IOC-001", type: "ip",     value: "185.220.101.42", severity: "Critical", source: "REMnux-01", firstSeen: Date.now() - 3600_000, hits: 17, tags: ["c2", "tor"] },
  { id: "IOC-002", type: "domain", value: "cdn-verify.win", severity: "Critical", source: "REMnux-01", firstSeen: Date.now() - 3400_000, hits: 5,  tags: ["c2"] },
  { id: "IOC-003", type: "hash",   value: "e4d8a3b21c...9f", severity: "High",     source: "Malware sample x47", firstSeen: Date.now() - 7000_000, hits: 3, tags: ["malware"] },
  { id: "IOC-004", type: "port",   value: ":6667",           severity: "Medium",   source: "Kali-01", firstSeen: Date.now() - 90000_000, hits: 1, tags: ["irc"] },
];

let incidents: Incident[] = load(INC_KEY, seedIncidents);
let iocs: IOC[] = load(IOC_KEY, seedIocs);
let incCounter = 1043;
let iocCounter = 5;

const incListeners = new Set<(x: Incident[]) => void>();
const iocListeners = new Set<(x: IOC[]) => void>();

const emitInc = () => { save(INC_KEY, incidents); incListeners.forEach((l) => l(incidents)); };
const emitIoc = () => { save(IOC_KEY, iocs); iocListeners.forEach((l) => l(iocs)); };

// ------- public API --------------------------------------------------------

export const subscribeIncidents = (cb: (x: Incident[]) => void) => {
  incListeners.add(cb); cb(incidents);
  return () => { incListeners.delete(cb); };
};
export const subscribeIocs = (cb: (x: IOC[]) => void) => {
  iocListeners.add(cb); cb(iocs);
  return () => { iocListeners.delete(cb); };
};

export const getIncidents = () => incidents;
export const getIocs = () => iocs;

export const createIncident = (partial: Omit<Incident, "id" | "createdAt" | "updatedAt" | "notes" | "linkedSignals" | "linkedIocs"> & Partial<Pick<Incident, "notes" | "linkedSignals" | "linkedIocs">>): Incident => {
  const now = Date.now();
  const inc: Incident = {
    id: `INC-${incCounter++}`,
    createdAt: now, updatedAt: now,
    notes: partial.notes ?? [],
    linkedSignals: partial.linkedSignals ?? [],
    linkedIocs: partial.linkedIocs ?? [],
    ...partial,
  };
  incidents = [inc, ...incidents].slice(0, 100);
  emitInc();
  return inc;
};

export const updateIncident = (id: string, patch: Partial<Incident>) => {
  incidents = incidents.map((i) => i.id === id ? { ...i, ...patch, updatedAt: Date.now() } : i);
  emitInc();
};

export const addIncidentNote = (id: string, note: string) => {
  incidents = incidents.map((i) => i.id === id ? { ...i, notes: [`${new Date().toLocaleTimeString()} — ${note}`, ...i.notes], updatedAt: Date.now() } : i);
  emitInc();
};

export const addIoc = (partial: Omit<IOC, "id" | "firstSeen" | "hits"> & Partial<Pick<IOC, "hits">>): IOC => {
  const existing = iocs.find((i) => i.value === partial.value && i.type === partial.type);
  if (existing) {
    iocs = iocs.map((i) => i === existing ? { ...i, hits: i.hits + 1 } : i);
    emitIoc();
    return existing;
  }
  const ioc: IOC = {
    id: `IOC-${String(iocCounter++).padStart(3, "0")}`,
    firstSeen: Date.now(), hits: 1,
    ...partial,
  };
  iocs = [ioc, ...iocs].slice(0, 200);
  emitIoc();
  return ioc;
};

export const removeIoc = (id: string) => {
  iocs = iocs.filter((i) => i.id !== id);
  emitIoc();
};

// ------- bus wiring: auto-create incidents/IOCs from cockpit events --------

let wired = false;
export const wireIncidentBus = () => {
  if (wired) return; wired = true;

  bus.on("signal.created", (p) => {
    if (p.severity !== "Critical") return;
    createIncident({
      title: `${p.type} on ${p.source}`,
      severity: p.severity, status: "Open",
      owner: "unassigned", source: `Signal ${p.id}`,
      linkedSignals: [p.id],
    });
  });

  bus.on("port.discovered", (p) => {
    if (!p.unexpected) return;
    addIoc({ type: "port", value: `${p.host}:${p.port}`, severity: "Medium", source: "Port scan", tags: [p.service] });
  });

  bus.on("vulnerability.detected", (p) => {
    addIoc({ type: "hash", value: p.cve ?? p.id, severity: p.severity, source: p.asset, tags: ["vuln"] });
  });
};
