// Client-only RBAC. Current operator lives in localStorage; capability checks
// gate destructive UI actions across the cockpit. Not a security boundary —
// just a UX guard that respects the role assigned in Settings.

import { useEffect, useState } from "react";
import { subscribeOperators, type Operator, type Role } from "./settingsStore";

export type Action =
  | "operator.manage"
  | "integration.toggle"
  | "incident.create"
  | "incident.advance"
  | "incident.close"
  | "ioc.create"
  | "ioc.remove"
  | "mission.launch"
  | "vault.seal"
  | "vault.clear"
  | "report.publish"
  | "scan.run"
  | "state.export"
  | "state.import";

const matrix: Record<Role, Action[]> = {
  Admin:    ["operator.manage","integration.toggle","incident.create","incident.advance","incident.close","ioc.create","ioc.remove","mission.launch","vault.seal","vault.clear","report.publish","scan.run","state.export","state.import"],
  Analyst:  ["incident.create","incident.advance","incident.close","ioc.create","ioc.remove","mission.launch","vault.seal","report.publish","scan.run","state.export"],
  Operator: ["incident.create","incident.advance","ioc.create","mission.launch","vault.seal","scan.run","state.export"],
  Auditor:  ["report.publish","state.export"],
  Viewer:   [],
};

const CUR_KEY = "redrainbow.currentOperator.v1";

const load = (): string => {
  if (typeof window === "undefined") return "OP-01";
  try { return window.localStorage.getItem(CUR_KEY) ?? "OP-01"; } catch { return "OP-01"; }
};

let currentId = load();
const listeners = new Set<(id: string) => void>();

export const getCurrentOperatorId = () => currentId;
export const setCurrentOperatorId = (id: string) => {
  currentId = id;
  try { window.localStorage.setItem(CUR_KEY, id); } catch { /* ignore */ }
  listeners.forEach((l) => l(id));
};

export const subscribeCurrentOperator = (cb: (id: string) => void) => {
  listeners.add(cb); cb(currentId);
  return () => { listeners.delete(cb); };
};

export function useCurrentOperator(): Operator | null {
  const [op, setOp] = useState<Operator | null>(null);
  useEffect(() => {
    let ops: Operator[] = [];
    let id = currentId;
    const resolve = () => setOp(ops.find((o) => o.id === id) ?? null);
    const a = subscribeOperators((x) => { ops = x; resolve(); });
    const b = subscribeCurrentOperator((x) => { id = x; resolve(); });
    return () => { a(); b(); };
  }, []);
  return op;
}

export function can(role: Role | undefined, action: Action): boolean {
  if (!role) return false;
  return matrix[role].includes(action);
}

export function useCan(action: Action): boolean {
  const op = useCurrentOperator();
  return can(op?.role, action);
}
