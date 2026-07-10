import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertOctagon, Plus, Filter, Clock, User, Radio, Fingerprint, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  subscribeIncidents, createIncident, updateIncident, addIncidentNote, wireIncidentBus,
  type Incident, type IncidentStatus,
} from "@/lib/incidentStore";
import { publishToVault } from "@/lib/vaultStore";

const sevStyle: Record<string, string> = {
  Critical: "text-primary border-primary/30 bg-primary/10",
  High:     "text-glow-amber border-glow-amber/30 bg-glow-amber/10",
  Medium:   "text-secondary border-secondary/30 bg-secondary/10",
  Low:      "text-glow-green border-glow-green/30 bg-glow-green/10",
  Info:     "text-muted-foreground border-border bg-muted/30",
};
const statusFlow: IncidentStatus[] = ["Open", "Investigating", "Contained", "Closed"];
const statusStyle: Record<IncidentStatus, string> = {
  Open:          "text-primary",
  Investigating: "text-glow-amber",
  Contained:     "text-secondary",
  Closed:        "text-glow-green",
};

const fmt = (ts: number) => {
  const s = Math.max(1, Math.floor((Date.now() - ts) / 1000));
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
};

const Incidents = () => {
  const [items, setItems] = useState<Incident[]>([]);
  const [filter, setFilter] = useState<"All" | IncidentStatus>("All");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState("");

  useEffect(() => { wireIncidentBus(); const u = subscribeIncidents(setItems); return () => u(); }, []);
  useEffect(() => { if (!selectedId && items[0]) setSelectedId(items[0].id); }, [items, selectedId]);

  const visible = useMemo(
    () => filter === "All" ? items : items.filter((i) => i.status === filter),
    [items, filter],
  );
  const selected = items.find((i) => i.id === selectedId) ?? visible[0];

  const advance = (inc: Incident) => {
    const idx = statusFlow.indexOf(inc.status);
    const next = statusFlow[Math.min(idx + 1, statusFlow.length - 1)];
    updateIncident(inc.id, { status: next });
    toast.success(`${inc.id} → ${next}`);
    if (next === "Closed") {
      publishToVault({
        name: `${inc.id}_case_file.json`, type: "Document", size: "42 KB",
        source: `incident:${inc.id}`,
      });
      toast.info("Case file sealed to Evidence Vault");
    }
  };

  const spawn = () => {
    const inc = createIncident({
      title: "Manual triage — analyst opened",
      severity: "Medium", status: "Open", owner: "ghost.7", source: "manual",
    });
    setSelectedId(inc.id);
    toast.success(`${inc.id} opened`);
  };

  const submitNote = () => {
    if (!selected || !noteDraft.trim()) return;
    addIncidentNote(selected.id, noteDraft.trim());
    setNoteDraft("");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Incident Management</h1>
          <p className="font-mono text-xs text-muted-foreground mt-1">Case-book for active investigations — auto-opened from critical signals</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 rounded border border-border/50 bg-card/50 p-1">
            <Filter className="h-3 w-3 text-muted-foreground ml-1" />
            {(["All", ...statusFlow] as const).map((s) => (
              <button key={s} onClick={() => setFilter(s)}
                className={`px-2 py-1 rounded font-mono text-[10px] transition-colors ${filter === s ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground"}`}>
                {s}
              </button>
            ))}
          </div>
          <Button onClick={spawn} className="font-mono bg-primary hover:bg-primary/90 text-primary-foreground glow-red text-sm">
            <Plus className="h-4 w-4 mr-2" /> New Incident
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total", value: items.length, tone: "text-foreground" },
          { label: "Open", value: items.filter((i) => i.status === "Open").length, tone: "text-primary" },
          { label: "Investigating", value: items.filter((i) => i.status === "Investigating").length, tone: "text-glow-amber" },
          { label: "Closed 24h", value: items.filter((i) => i.status === "Closed" && Date.now() - i.updatedAt < 86400_000).length, tone: "text-glow-green" },
        ].map((k) => (
          <div key={k.label} className="p-4 rounded-lg border border-border/50 bg-card/50">
            <AlertOctagon className="h-4 w-4 text-secondary mb-2" />
            <p className={`text-xl font-bold ${k.tone}`}>{k.value}</p>
            <p className="font-mono text-xs text-muted-foreground">{k.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* List */}
        <div className="lg:col-span-2 rounded-lg border border-border/50 bg-card/50 overflow-hidden">
          <div className="p-3 border-b border-border/50 flex items-center gap-2">
            <span className="status-dot" />
            <span className="font-mono text-xs text-muted-foreground">CASE-BOOK</span>
          </div>
          <div className="divide-y divide-border/30 max-h-[560px] overflow-y-auto">
            <AnimatePresence initial={false}>
              {visible.map((inc) => (
                <motion.button key={inc.id}
                  initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, height: 0 }}
                  onClick={() => setSelectedId(inc.id)}
                  className={`w-full text-left p-4 hover:bg-muted/20 transition-colors ${selected?.id === inc.id ? "bg-muted/30" : ""}`}>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-mono text-xs text-secondary">{inc.id}</span>
                    <span className={`px-2 py-0.5 rounded text-xs font-mono border ${sevStyle[inc.severity]}`}>{inc.severity}</span>
                    <span className={`font-mono text-xs ${statusStyle[inc.status]}`}>● {inc.status}</span>
                    <span className="ml-auto font-mono text-[10px] text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {fmt(inc.updatedAt)}
                    </span>
                  </div>
                  <p className="text-sm text-foreground truncate">{inc.title}</p>
                  <div className="flex items-center gap-3 mt-1 font-mono text-[10px] text-muted-foreground">
                    <span className="flex items-center gap-1"><User className="h-3 w-3" /> {inc.owner}</span>
                    <span className="flex items-center gap-1"><Radio className="h-3 w-3" /> {inc.linkedSignals.length} signals</span>
                    <span className="flex items-center gap-1"><Fingerprint className="h-3 w-3" /> {inc.linkedIocs.length} IOCs</span>
                  </div>
                </motion.button>
              ))}
            </AnimatePresence>
            {visible.length === 0 && (
              <div className="p-8 text-center font-mono text-xs text-muted-foreground">No incidents in this bucket.</div>
            )}
          </div>
        </div>

        {/* Detail */}
        <div className="rounded-lg border border-border/50 bg-card/50 p-5 space-y-4">
          {selected ? (
            <>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-mono text-xs text-secondary">{selected.id}</span>
                  <span className={`px-2 py-0.5 rounded text-xs font-mono border ${sevStyle[selected.severity]}`}>{selected.severity}</span>
                </div>
                <h2 className="text-lg font-bold text-foreground">{selected.title}</h2>
                <p className="font-mono text-xs text-muted-foreground mt-1">Source: {selected.source}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 font-mono text-xs">
                <div><span className="text-muted-foreground">Owner</span><br /><span className="text-foreground">{selected.owner}</span></div>
                <div><span className="text-muted-foreground">Status</span><br /><span className={statusStyle[selected.status]}>{selected.status}</span></div>
                <div><span className="text-muted-foreground">Opened</span><br /><span className="text-foreground">{fmt(selected.createdAt)}</span></div>
                <div><span className="text-muted-foreground">Updated</span><br /><span className="text-foreground">{fmt(selected.updatedAt)}</span></div>
              </div>

              {selected.status !== "Closed" && (
                <Button onClick={() => advance(selected)} className="w-full font-mono bg-primary hover:bg-primary/90 text-primary-foreground text-sm">
                  Advance → {statusFlow[Math.min(statusFlow.indexOf(selected.status) + 1, statusFlow.length - 1)]}
                </Button>
              )}

              <div>
                <p className="font-mono text-xs text-muted-foreground uppercase tracking-wider mb-2">Notes</p>
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {selected.notes.length === 0 && <p className="font-mono text-xs text-muted-foreground italic">No notes yet.</p>}
                  {selected.notes.map((n, i) => (
                    <p key={i} className="font-mono text-xs text-foreground p-2 rounded bg-muted/20 border border-border/40">{n}</p>
                  ))}
                </div>
                <div className="flex gap-2 mt-2">
                  <Input value={noteDraft} onChange={(e) => setNoteDraft(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && submitNote()}
                    placeholder="Add investigation note…" className="font-mono text-xs h-8" />
                  <Button size="sm" onClick={submitNote} className="h-8"><Send className="h-3 w-3" /></Button>
                </div>
              </div>
            </>
          ) : (
            <p className="font-mono text-xs text-muted-foreground">Select an incident to review.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Incidents;
