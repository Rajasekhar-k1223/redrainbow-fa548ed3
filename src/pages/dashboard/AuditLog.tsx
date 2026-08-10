import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ScrollText, Download, Search, Lock, AlertOctagon, Layers, Trash2, Fingerprint, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  subscribeAudit, downloadAuditEvidence, clearAudit,
  type AuditEntry, type AuditDomain,
} from "@/lib/auditStore";
import { useCan } from "@/lib/rbac";

const domainMeta: Record<AuditDomain, { label: string; icon: typeof Lock; tone: string; dot: string }> = {
  vault:    { label: "Vault",    icon: Lock,          tone: "text-secondary border-secondary/30 bg-secondary/10", dot: "bg-secondary" },
  incident: { label: "Incident", icon: AlertOctagon,  tone: "text-primary border-primary/30 bg-primary/10",       dot: "bg-primary" },
  mission:  { label: "Mission",  icon: Layers,        tone: "text-glow-amber border-glow-amber/30 bg-glow-amber/10", dot: "bg-glow-amber" },
  response: { label: "Response", icon: Zap,           tone: "text-glow-green border-glow-green/30 bg-glow-green/10", dot: "bg-glow-green" },
};

const fmtTime = (ts: number) =>
  new Date(ts).toISOString().replace("T", " ").slice(0, 19) + "Z";

const AuditLog = () => {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [filter, setFilter] = useState<"All" | AuditDomain>("All");
  const [query, setQuery] = useState("");
  const canPurge = useCan("vault.clear");

  useEffect(() => subscribeAudit(setEntries), []);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return entries.filter((e) => {
      if (filter !== "All" && e.domain !== filter) return false;
      if (!q) return true;
      return [e.id, e.subject, e.action, e.summary, e.actor].join(" ").toLowerCase().includes(q);
    });
  }, [entries, filter, query]);

  const counts = useMemo(() => ({
    vault: entries.filter((e) => e.domain === "vault").length,
    incident: entries.filter((e) => e.domain === "incident").length,
    mission: entries.filter((e) => e.domain === "mission").length,
  }), [entries]);

  const exportAll = () => {
    const payload = downloadAuditEvidence(visible);
    toast.success(`Exported ${payload.entryCount} audit entries`, { description: `Chain head ${payload.chainHead}` });
  };

  const exportOne = (e: AuditEntry) => {
    downloadAuditEvidence([e], `audit-${e.id}.json`);
    toast.info(`${e.id} evidence downloaded`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Audit Ledger</h1>
          <p className="font-mono text-xs text-muted-foreground mt-1">
            Append-only timeline of every vault, incident, and mission action — tamper-evident digest chain
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={exportAll} className="font-mono bg-primary hover:bg-primary/90 text-primary-foreground glow-red text-sm">
            <Download className="h-4 w-4 mr-2" /> Export JSON Evidence
          </Button>
          {canPurge && (
            <Button
              variant="outline"
              onClick={() => { clearAudit(); toast.info("Audit ledger reset"); }}
              className="font-mono text-sm border-border/60"
            >
              <Trash2 className="h-4 w-4 mr-2" /> Reset
            </Button>
          )}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Entries", value: entries.length, tone: "text-foreground", icon: ScrollText },
          { label: "Vault Actions", value: counts.vault, tone: "text-secondary", icon: Lock },
          { label: "Incident Actions", value: counts.incident, tone: "text-primary", icon: AlertOctagon },
          { label: "Mission Actions", value: counts.mission, tone: "text-glow-amber", icon: Layers },
        ].map((k) => (
          <div key={k.label} className="p-4 rounded-lg border border-border/50 bg-card/50">
            <k.icon className="h-4 w-4 text-muted-foreground mb-2" />
            <p className={`text-xl font-bold ${k.tone}`}>{k.value}</p>
            <p className="font-mono text-xs text-muted-foreground">{k.label}</p>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search subject, action, actor…"
            className="pl-8 font-mono text-xs h-9"
          />
        </div>
        <div className="flex items-center gap-1 rounded border border-border/50 bg-card/50 p-1">
          {(["All", "vault", "incident", "mission", "response"] as const).map((d) => (
            <button
              key={d}
              onClick={() => setFilter(d)}
              className={`px-2.5 py-1 rounded font-mono text-[10px] uppercase tracking-wider transition-colors ${
                filter === d ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {d === "All" ? "All" : domainMeta[d].label}
            </button>
          ))}
        </div>
      </div>

      {/* Timeline */}
      <div className="rounded-lg border border-border/50 bg-card/50 overflow-hidden">
        <div className="p-3 border-b border-border/50 flex items-center gap-2">
          <span className="status-dot" />
          <span className="font-mono text-xs text-muted-foreground">CHAIN-OF-ACTION TIMELINE</span>
          <span className="ml-auto font-mono text-[10px] text-muted-foreground">
            {visible.length} / {entries.length} entries
          </span>
        </div>

        <div className="max-h-[620px] overflow-y-auto p-5">
          {visible.length === 0 ? (
            <p className="py-10 text-center font-mono text-xs text-muted-foreground">
              No audit entries yet — seal evidence, open an incident, or launch a mission.
            </p>
          ) : (
            <ol className="relative border-l border-border/50 ml-3 space-y-4">
              <AnimatePresence initial={false}>
                {visible.map((e) => {
                  const meta = domainMeta[e.domain];
                  return (
                    <motion.li
                      key={e.id}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, height: 0 }}
                      className="ml-6"
                    >
                      <span className={`absolute -left-[5px] mt-2 h-2.5 w-2.5 rounded-full ${meta.dot}`} />
                      <div className="p-4 rounded-lg border border-border/40 bg-background/40 hover:border-primary/20 transition-colors">
                        <div className="flex flex-wrap items-center gap-2.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-mono border uppercase tracking-wider ${meta.tone}`}>
                            {meta.label}
                          </span>
                          <span className="font-mono text-xs text-foreground">{e.action}</span>
                          <span className="font-mono text-xs text-secondary">{e.subject}</span>
                          <span className="ml-auto font-mono text-[10px] text-muted-foreground">{fmtTime(e.at)}</span>
                        </div>
                        <p className="text-sm text-foreground mt-2 break-words">{e.summary}</p>
                        <div className="flex flex-wrap items-center gap-4 mt-2 font-mono text-[10px] text-muted-foreground">
                          <span>{e.id}</span>
                          <span>actor: {e.actor}</span>
                          <span className="flex items-center gap-1">
                            <Fingerprint className="h-3 w-3" /> {e.digest}
                          </span>
                          <button
                            onClick={() => exportOne(e)}
                            className="ml-auto flex items-center gap-1 text-secondary hover:text-foreground transition-colors"
                          >
                            <Download className="h-3 w-3" /> JSON
                          </button>
                        </div>
                      </div>
                    </motion.li>
                  );
                })}
              </AnimatePresence>
            </ol>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuditLog;
