import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Zap, ShieldOff, Ban, UserX, Skull, KeyRound, HardDriveDownload,
  MessageSquare, Ticket, Radar, Lock, Play, CheckCircle2, XCircle,
  Loader2, ShieldCheck, Trash2, Clock,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { CopilotInline } from "@/components/CopilotInline";
import { useCan } from "@/lib/rbac";
import {
  playbooks, actionMeta, subscribeRuns, startRun, approveStep, abortRun, clearRuns,
  type ActionKind, type Playbook, type PlaybookRun, type RunStatus,
} from "@/lib/soarStore";

const actionIcons: Record<ActionKind, typeof Zap> = {
  "isolate-host": ShieldOff,
  "block-ip": Ban,
  "quarantine-user": UserX,
  "kill-process": Skull,
  "revoke-token": KeyRound,
  "snapshot-disk": HardDriveDownload,
  "notify-slack": MessageSquare,
  "open-ticket": Ticket,
  "enrich-intel": Radar,
  "seal-evidence": Lock,
};

const severityTone: Record<string, string> = {
  Critical: "text-primary border-primary/30 bg-primary/10",
  High: "text-glow-amber border-glow-amber/30 bg-glow-amber/10",
  Medium: "text-secondary border-secondary/30 bg-secondary/10",
  Low: "text-glow-green border-glow-green/30 bg-glow-green/10",
  Info: "text-muted-foreground border-border bg-muted/30",
};

const statusTone: Record<RunStatus, string> = {
  queued: "text-muted-foreground border-border bg-muted/30",
  running: "text-secondary border-secondary/30 bg-secondary/10",
  success: "text-glow-green border-glow-green/30 bg-glow-green/10",
  failed: "text-primary border-primary/30 bg-primary/10",
  "requires-approval": "text-glow-amber border-glow-amber/30 bg-glow-amber/10",
};

const StatusIcon = ({ status }: { status: RunStatus }) => {
  if (status === "running") return <Loader2 className="h-3.5 w-3.5 animate-spin text-secondary" />;
  if (status === "success") return <CheckCircle2 className="h-3.5 w-3.5 text-glow-green" />;
  if (status === "failed") return <XCircle className="h-3.5 w-3.5 text-primary" />;
  if (status === "requires-approval") return <ShieldCheck className="h-3.5 w-3.5 text-glow-amber" />;
  return <Clock className="h-3.5 w-3.5 text-muted-foreground" />;
};

const fmt = (ts?: number) => (ts ? new Date(ts).toISOString().replace("T", " ").slice(11, 19) + "Z" : "—");

const Response = () => {
  const [runs, setRuns] = useState<PlaybookRun[]>([]);
  const [category, setCategory] = useState<"All" | Playbook["category"]>("All");
  const canRun = useCan("mission.launch");
  const canPurge = useCan("vault.clear");

  useEffect(() => subscribeRuns(setRuns), []);

  const visible = useMemo(
    () => (category === "All" ? playbooks : playbooks.filter((p) => p.category === category)),
    [category],
  );

  const kpis = [
    { label: "Playbooks", value: playbooks.length, tone: "text-secondary", icon: Zap },
    { label: "Runs Executed", value: runs.length, tone: "text-foreground", icon: Play },
    { label: "Awaiting Approval", value: runs.filter((r) => r.status === "requires-approval").length, tone: "text-glow-amber", icon: ShieldCheck },
    { label: "Actions Fired", value: runs.reduce((n, r) => n + r.steps.filter((s) => s.status === "success").length, 0), tone: "text-glow-green", icon: CheckCircle2 },
  ];

  const launch = (pb: Playbook) => {
    const run = startRun(pb.id);
    if (run) toast.success(`${pb.name} dispatched → ${run.id}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Automated Response</h1>
          <p className="font-mono text-xs text-muted-foreground mt-1">
            SOAR playbooks — containment, eradication, recovery and notification actions with approval gates
          </p>
        </div>
        {canPurge && runs.length > 0 && (
          <Button variant="outline" size="sm" className="font-mono text-xs"
            onClick={() => { clearRuns(); toast.success("Run history cleared"); }}>
            <Trash2 className="h-3.5 w-3.5 mr-1.5" /> Clear runs
          </Button>
        )}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((k, i) => (
          <motion.div key={k.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="p-4 rounded-lg border border-border/50 bg-card/50">
            <k.icon className={`h-4 w-4 mb-2 ${k.tone}`} />
            <p className={`text-xl font-bold ${k.tone}`}>{k.value}</p>
            <p className="font-mono text-xs text-muted-foreground">{k.label}</p>
          </motion.div>
        ))}
      </div>

      <CopilotInline route="/dashboard/response" title="Copilot · Response Recommendations" />

      {/* Category filter */}
      <div className="flex items-center gap-1 rounded border border-border/50 bg-card/50 p-1 w-fit">
        {(["All", "Containment", "Eradication", "Recovery", "Notification"] as const).map((c) => (
          <button key={c} onClick={() => setCategory(c)}
            className={`px-2.5 py-1 rounded font-mono text-[10px] uppercase tracking-wider transition-colors ${
              category === c ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground"
            }`}>
            {c}
          </button>
        ))}
      </div>

      {/* Playbook library */}
      <div className="grid gap-4 lg:grid-cols-2">
        {visible.map((pb) => (
          <motion.div key={pb.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-lg border border-border/50 bg-card/50 p-4 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] text-muted-foreground tracking-wider">{pb.id}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono border ${severityTone[pb.severity]}`}>{pb.severity}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono border border-border bg-muted/30 text-muted-foreground">{pb.category}</span>
                </div>
                <h2 className="text-sm font-bold text-foreground mt-1.5">{pb.name}</h2>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{pb.description}</p>
              </div>
              <Button size="sm" disabled={!canRun} onClick={() => launch(pb)}
                className="font-mono text-[10px] tracking-wider flex-shrink-0">
                <Play className="h-3 w-3 mr-1" /> RUN
              </Button>
            </div>

            <p className="font-mono text-[10px] text-secondary/80">trigger: {pb.trigger}</p>

            <div className="space-y-1.5">
              {pb.steps.map((s, i) => {
                const Icon = actionIcons[s.action];
                return (
                  <div key={`${pb.id}-${i}`} className="flex items-center gap-2 text-xs">
                    <span className="font-mono text-[10px] text-muted-foreground w-4">{i + 1}</span>
                    <Icon className="h-3.5 w-3.5 text-secondary flex-shrink-0" />
                    <span className="text-foreground">{s.label}</span>
                    <span className="font-mono text-[10px] text-muted-foreground truncate">→ {s.target}</span>
                    {s.approval && (
                      <span className="ml-auto font-mono text-[10px] text-glow-amber border border-glow-amber/30 bg-glow-amber/10 rounded px-1.5 py-0.5 flex-shrink-0">
                        APPROVAL
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Run log */}
      <div className="rounded-lg border border-border/50 bg-card/50 overflow-hidden">
        <div className="p-4 border-b border-border/50 flex items-center gap-2">
          <span className="status-dot" />
          <span className="font-mono text-xs text-muted-foreground">RESPONSE RUN LOG</span>
        </div>

        {runs.length === 0 ? (
          <div className="p-8 text-center font-mono text-xs text-muted-foreground">
            No response runs yet — launch a playbook above to begin containment.
          </div>
        ) : (
          <div className="divide-y divide-border/30">
            <AnimatePresence initial={false}>
              {runs.map((r) => (
                <motion.div key={r.id} layout
                  initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, height: 0 }}
                  className="p-4 space-y-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <StatusIcon status={r.status} />
                    <span className="font-mono text-xs text-secondary">{r.id}</span>
                    <span className="text-sm text-foreground flex-1 min-w-[10rem]">{r.playbookName}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono border ${statusTone[r.status]}`}>
                      {r.status.replace("-", " ").toUpperCase()}
                    </span>
                    <span className="font-mono text-[10px] text-muted-foreground">{fmt(r.startedAt)} → {fmt(r.finishedAt)}</span>
                    {r.status === "requires-approval" && canRun && (
                      <div className="flex items-center gap-1.5">
                        <Button size="sm" onClick={() => { approveStep(r.id); toast.success(`Approved — ${r.id} resuming`); }}
                          className="font-mono text-[10px] h-7">
                          <ShieldCheck className="h-3 w-3 mr-1" /> APPROVE
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => { abortRun(r.id); toast.error(`${r.id} aborted`); }}
                          className="font-mono text-[10px] h-7">
                          ABORT
                        </Button>
                      </div>
                    )}
                    {r.status === "running" && canRun && (
                      <Button size="sm" variant="outline" onClick={() => { abortRun(r.id); toast.error(`${r.id} aborted`); }}
                        className="font-mono text-[10px] h-7">
                        ABORT
                      </Button>
                    )}
                  </div>

                  <div className="space-y-1 pl-6 border-l border-border/40">
                    {r.steps.map((s, i) => {
                      const Icon = actionIcons[s.action];
                      return (
                        <div key={`${r.id}-${i}`} className="flex items-center gap-2 text-xs">
                          <StatusIcon status={s.status} />
                          <Icon className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                          <span className="text-foreground">{actionMeta[s.action].label}</span>
                          <span className="font-mono text-[10px] text-secondary truncate">{s.target}</span>
                          <span className="font-mono text-[10px] text-muted-foreground truncate ml-auto">{s.detail}</span>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
};

export default Response;
