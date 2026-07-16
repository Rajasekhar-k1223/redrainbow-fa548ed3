import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Users, Plus, Trash2, Shield, KeyRound, Bell, Palette, Save, Download, Upload, UserCog } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  subscribeOperators, addOperator, updateOperator, removeOperator,
  subscribePrefs, updatePrefs,
  type Operator, type Role, type Preferences,
} from "@/lib/settingsStore";
import { useCurrentOperator, setCurrentOperatorId, useCan } from "@/lib/rbac";
import { downloadSnapshot, importSnapshot } from "@/lib/stateSnapshot";

const ROLES: Role[] = ["Admin", "Analyst", "Operator", "Auditor", "Viewer"];
const roleStyle: Record<Role, string> = {
  Admin:    "text-primary border-primary/30 bg-primary/10",
  Analyst:  "text-glow-amber border-glow-amber/30 bg-glow-amber/10",
  Operator: "text-secondary border-secondary/30 bg-secondary/10",
  Auditor:  "text-glow-green border-glow-green/30 bg-glow-green/10",
  Viewer:   "text-muted-foreground border-border bg-muted/30",
};

const roleCapabilities: Record<Role, string[]> = {
  Admin:    ["Full read/write", "Manage operators", "Manage integrations", "Publish reports"],
  Analyst:  ["Read all", "Triage signals", "Open/close incidents", "Add IOCs"],
  Operator: ["Read all", "Run scans", "Launch missions", "Seal evidence"],
  Auditor:  ["Read-only", "Export compliance reports"],
  Viewer:   ["Read-only dashboards"],
};

const SettingsPage = () => {
  const [operators, setOperators] = useState<Operator[]>([]);
  const [prefs, setPrefs] = useState<Preferences | null>(null);
  const [draft, setDraft] = useState<{ handle: string; email: string; role: Role }>({ handle: "", email: "", role: "Analyst" });
  const currentOp = useCurrentOperator();
  const canManage = useCan("operator.manage");
  const canExport = useCan("state.export");
  const canImport = useCan("state.import");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const a = subscribeOperators(setOperators);
    const b = subscribePrefs(setPrefs);
    return () => { a(); b(); };
  }, []);

  const invite = () => {
    if (!canManage) return toast.error("Insufficient role");
    if (!draft.handle.trim() || !draft.email.trim()) return toast.error("Handle and email required");
    const op = addOperator({ handle: draft.handle.trim(), email: draft.email.trim(), role: draft.role, mfa: false });
    toast.success(`${op.handle} invited as ${op.role}`);
    setDraft({ handle: "", email: "", role: "Analyst" });
  };

  const onImport = async (f: File | undefined) => {
    if (!f || !canImport) return;
    try { await importSnapshot(f); } catch (e) { toast.error(`Import failed: ${(e as Error).message}`); }
  };

  if (!prefs) return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Settings & RBAC</h1>
          <p className="font-mono text-xs text-muted-foreground mt-1">Operator roster, role capabilities, and cockpit preferences</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 rounded border border-border/50 bg-card/50">
          <UserCog className="h-4 w-4 text-secondary" />
          <span className="font-mono text-[10px] tracking-wider text-muted-foreground uppercase">Acting as</span>
          <select
            value={currentOp?.id ?? ""}
            onChange={(e) => { setCurrentOperatorId(e.target.value); toast.success(`Switched operator`); }}
            className="h-7 px-2 rounded bg-background border border-border/50 font-mono text-xs text-foreground"
          >
            {operators.map((o) => <option key={o.id} value={o.id}>{o.handle} — {o.role}</option>)}
          </select>
        </div>
      </div>

      {/* Operator roster */}
      <div className="rounded-lg border border-border/50 bg-card/50 overflow-hidden">
        <div className="p-4 border-b border-border/50 flex items-center gap-2">
          <Users className="h-4 w-4 text-secondary" />
          <span className="font-mono text-xs text-muted-foreground uppercase tracking-wider">Operator Roster</span>
          <span className="ml-auto font-mono text-xs text-foreground">{operators.length}</span>
        </div>

        {canManage && (
          <div className="p-4 border-b border-border/50 flex flex-wrap gap-2 items-center bg-muted/10">
            <Input value={draft.handle} onChange={(e) => setDraft({ ...draft, handle: e.target.value })}
              placeholder="handle (e.g. phantom.5)" className="font-mono text-xs h-9 max-w-[180px]" />
            <Input value={draft.email} onChange={(e) => setDraft({ ...draft, email: e.target.value })}
              placeholder="email@redrainbow.io" className="font-mono text-xs h-9 flex-1 min-w-[200px]" />
            <select value={draft.role} onChange={(e) => setDraft({ ...draft, role: e.target.value as Role })}
              className="h-9 px-2 rounded bg-background border border-border/50 font-mono text-xs text-foreground">
              {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
            <Button onClick={invite} className="font-mono text-xs h-9 bg-primary hover:bg-primary/90 text-primary-foreground">
              <Plus className="h-3 w-3 mr-1" /> Invite
            </Button>
          </div>
        )}
        {!canManage && (
          <div className="p-3 border-b border-border/50 bg-muted/10 font-mono text-[11px] text-muted-foreground">
            Read-only: your role ({currentOp?.role ?? "—"}) cannot manage operators.
          </div>
        )}

        <div className="divide-y divide-border/30">
          {operators.map((op, i) => (
            <motion.div key={op.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
              className="grid grid-cols-1 md:grid-cols-12 gap-3 px-4 py-3 items-center group">
              <div className="md:col-span-3">
                <p className="text-sm text-foreground font-medium">{op.handle}</p>
                <p className="font-mono text-[10px] text-muted-foreground">{op.id}</p>
              </div>
              <div className="md:col-span-3 font-mono text-xs text-muted-foreground truncate">{op.email}</div>
              <div className="md:col-span-2">
                <select value={op.role} onChange={(e) => { updateOperator(op.id, { role: e.target.value as Role }); toast.success(`${op.handle} → ${e.target.value}`); }}
                  className={`h-7 px-2 rounded border font-mono text-xs ${roleStyle[op.role]}`}>
                  {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div className="md:col-span-2 flex items-center gap-2">
                <button onClick={() => updateOperator(op.id, { mfa: !op.mfa })}
                  className={`flex items-center gap-1 font-mono text-xs ${op.mfa ? "text-glow-green" : "text-muted-foreground"}`}>
                  <KeyRound className="h-3 w-3" /> MFA {op.mfa ? "ON" : "OFF"}
                </button>
              </div>
              <div className="md:col-span-1 font-mono text-[10px] text-muted-foreground">{op.lastActive}</div>
              <div className="md:col-span-1 text-right">
                <button onClick={() => { removeOperator(op.id); toast.success(`${op.handle} removed`); }}
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-primary">
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Role matrix */}
      <div className="rounded-lg border border-border/50 bg-card/50 p-5">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="h-4 w-4 text-secondary" />
          <span className="font-mono text-xs text-muted-foreground uppercase tracking-wider">Role Capability Matrix</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {ROLES.map((r) => (
            <div key={r} className="p-3 rounded border border-border/40 bg-background/40">
              <span className={`inline-block px-2 py-0.5 rounded text-xs font-mono border ${roleStyle[r]}`}>{r}</span>
              <ul className="mt-3 space-y-1 font-mono text-[11px] text-muted-foreground">
                {roleCapabilities[r].map((c) => <li key={c}>• {c}</li>)}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Preferences */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-lg border border-border/50 bg-card/50 p-5">
          <div className="flex items-center gap-2 mb-4"><Palette className="h-4 w-4 text-secondary" />
            <span className="font-mono text-xs text-muted-foreground uppercase tracking-wider">Cockpit Preferences</span>
          </div>
          <div className="space-y-4">
            <label className="block">
              <span className="font-mono text-xs text-muted-foreground">Theme</span>
              <select value={prefs.theme} onChange={(e) => { updatePrefs({ theme: e.target.value as Preferences["theme"] }); toast.success("Theme updated"); }}
                className="mt-1 w-full h-9 px-2 rounded bg-background border border-border/50 font-mono text-xs text-foreground">
                <option value="cinematic-red">Cinematic Red (default)</option>
                <option value="cinematic-cyan">Cinematic Cyan</option>
              </select>
            </label>
            <label className="block">
              <span className="font-mono text-xs text-muted-foreground">Density</span>
              <select value={prefs.density} onChange={(e) => updatePrefs({ density: e.target.value as Preferences["density"] })}
                className="mt-1 w-full h-9 px-2 rounded bg-background border border-border/50 font-mono text-xs text-foreground">
                <option value="comfortable">Comfortable</option>
                <option value="compact">Compact</option>
              </select>
            </label>
            <label className="block">
              <span className="font-mono text-xs text-muted-foreground">Telemetry polling (seconds)</span>
              <Input type="number" step="0.5" min="1" value={prefs.telemetryPolling}
                onChange={(e) => updatePrefs({ telemetryPolling: Number(e.target.value) || 2.5 })}
                className="mt-1 font-mono text-xs h-9" />
            </label>
          </div>
        </div>

        <div className="rounded-lg border border-border/50 bg-card/50 p-5">
          <div className="flex items-center gap-2 mb-4"><Bell className="h-4 w-4 text-secondary" />
            <span className="font-mono text-xs text-muted-foreground uppercase tracking-wider">Automation</span>
          </div>
          <div className="space-y-4">
            {[
              { key: "autoSealEvidence" as const, label: "Auto-seal terminal captures to Evidence Vault" },
              { key: "desktopNotifications" as const, label: "Desktop notifications for critical signals" },
            ].map((row) => (
              <label key={row.key} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
                <span className="text-sm text-foreground">{row.label}</span>
                <button onClick={() => updatePrefs({ [row.key]: !prefs[row.key] } as Partial<Preferences>)}
                  className={`w-11 h-6 rounded-full transition-colors relative ${prefs[row.key] ? "bg-primary" : "bg-muted"}`}>
                  <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-background transition-all ${prefs[row.key] ? "left-5" : "left-0.5"}`} />
                </button>
              </label>
            ))}
            <Button onClick={() => toast.success("Preferences persisted to local vault")}
              className="w-full font-mono text-xs bg-primary/10 hover:bg-primary/20 text-primary border border-primary/40">
              <Save className="h-3 w-3 mr-2" /> Confirm saved
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
