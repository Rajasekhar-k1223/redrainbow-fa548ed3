// Settings / RBAC / Integrations — client-only, localStorage-persisted.
// These are UI-only mocks (client-only per user preference) — no real auth.

export type Role = "Admin" | "Analyst" | "Operator" | "Auditor" | "Viewer";

export interface Operator {
  id: string;
  handle: string;
  email: string;
  role: Role;
  mfa: boolean;
  lastActive: string;
}

export interface Integration {
  id: string;
  name: string;
  category: "SIEM" | "Chat" | "Ticketing" | "Threat Intel" | "Cloud";
  status: "Connected" | "Disconnected" | "Error";
  lastSync?: string;
}

export interface Preferences {
  theme: "cinematic-red" | "cinematic-cyan";
  density: "comfortable" | "compact";
  telemetryPolling: number; // seconds
  autoSealEvidence: boolean;
  desktopNotifications: boolean;
}

const OPS_KEY = "redrainbow.operators.v1";
const INT_KEY = "redrainbow.integrations.v1";
const PREF_KEY = "redrainbow.prefs.v1";

const load = <T>(k: string, fb: T): T => {
  if (typeof window === "undefined") return fb;
  try { const raw = window.localStorage.getItem(k); return raw ? JSON.parse(raw) as T : fb; }
  catch { return fb; }
};
const save = (k: string, v: unknown) => {
  if (typeof window === "undefined") return;
  try { window.localStorage.setItem(k, JSON.stringify(v)); } catch { /* ignore */ }
};

const seedOperators: Operator[] = [
  { id: "OP-01", handle: "ghost.7",    email: "ghost@redrainbow.io",   role: "Admin",    mfa: true,  lastActive: "now" },
  { id: "OP-02", handle: "wraith.2",   email: "wraith@redrainbow.io",  role: "Analyst",  mfa: true,  lastActive: "12m ago" },
  { id: "OP-03", handle: "specter.4",  email: "specter@redrainbow.io", role: "Operator", mfa: true,  lastActive: "2h ago" },
  { id: "OP-04", handle: "raven.9",    email: "raven@redrainbow.io",   role: "Auditor",  mfa: false, lastActive: "1d ago" },
  { id: "OP-05", handle: "cipher.1",   email: "cipher@redrainbow.io",  role: "Viewer",   mfa: true,  lastActive: "3d ago" },
];

const seedIntegrations: Integration[] = [
  { id: "INT-splunk",   name: "Splunk Enterprise",  category: "SIEM",         status: "Connected",    lastSync: "1m ago" },
  { id: "INT-elastic",  name: "Elastic Security",   category: "SIEM",         status: "Connected",    lastSync: "3m ago" },
  { id: "INT-slack",    name: "Slack",              category: "Chat",         status: "Connected",    lastSync: "just now" },
  { id: "INT-teams",    name: "Microsoft Teams",    category: "Chat",         status: "Disconnected" },
  { id: "INT-jira",     name: "Jira Service Mgmt",  category: "Ticketing",    status: "Connected",    lastSync: "8m ago" },
  { id: "INT-pd",       name: "PagerDuty",          category: "Ticketing",    status: "Error",        lastSync: "22m ago" },
  { id: "INT-misp",     name: "MISP",               category: "Threat Intel", status: "Connected",    lastSync: "14m ago" },
  { id: "INT-otx",      name: "AlienVault OTX",     category: "Threat Intel", status: "Disconnected" },
  { id: "INT-aws",      name: "AWS Security Hub",   category: "Cloud",        status: "Connected",    lastSync: "5m ago" },
  { id: "INT-azure",    name: "Azure Defender",     category: "Cloud",        status: "Disconnected" },
];

const seedPrefs: Preferences = {
  theme: "cinematic-red", density: "comfortable",
  telemetryPolling: 2.5, autoSealEvidence: true, desktopNotifications: false,
};

let operators: Operator[] = load(OPS_KEY, seedOperators);
let integrations: Integration[] = load(INT_KEY, seedIntegrations);
let prefs: Preferences = load(PREF_KEY, seedPrefs);
let opCounter = 6;

const opListeners = new Set<(x: Operator[]) => void>();
const intListeners = new Set<(x: Integration[]) => void>();
const prefListeners = new Set<(x: Preferences) => void>();

const emitOps = () => { save(OPS_KEY, operators); opListeners.forEach((l) => l(operators)); };
const emitInts = () => { save(INT_KEY, integrations); intListeners.forEach((l) => l(integrations)); };
const emitPrefs = () => { save(PREF_KEY, prefs); prefListeners.forEach((l) => l(prefs)); };

export const subscribeOperators = (cb: (x: Operator[]) => void) => { opListeners.add(cb); cb(operators); return () => { opListeners.delete(cb); }; };
export const subscribeIntegrations = (cb: (x: Integration[]) => void) => { intListeners.add(cb); cb(integrations); return () => { intListeners.delete(cb); }; };
export const subscribePrefs = (cb: (x: Preferences) => void) => { prefListeners.add(cb); cb(prefs); return () => { prefListeners.delete(cb); }; };

export const addOperator = (o: Omit<Operator, "id" | "lastActive">) => {
  const op: Operator = { id: `OP-${String(opCounter++).padStart(2, "0")}`, lastActive: "just added", ...o };
  operators = [op, ...operators]; emitOps(); return op;
};
export const updateOperator = (id: string, patch: Partial<Operator>) => {
  operators = operators.map((o) => o.id === id ? { ...o, ...patch } : o); emitOps();
};
export const removeOperator = (id: string) => {
  operators = operators.filter((o) => o.id !== id); emitOps();
};

export const toggleIntegration = (id: string) => {
  integrations = integrations.map((i) => i.id === id
    ? { ...i, status: i.status === "Connected" ? "Disconnected" : "Connected", lastSync: "just now" }
    : i);
  emitInts();
};

export const updatePrefs = (patch: Partial<Preferences>) => { prefs = { ...prefs, ...patch }; emitPrefs(); };
export const getPrefs = () => prefs;
