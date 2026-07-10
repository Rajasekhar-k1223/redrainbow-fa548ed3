import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Fingerprint, Plus, Search, Trash2, Globe, Hash, Server, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { subscribeIocs, addIoc, removeIoc, wireIncidentBus, type IOC, type IOCType } from "@/lib/incidentStore";

const typeIcon: Record<IOCType, React.ComponentType<{ className?: string }>> = {
  ip: Server, domain: Globe, hash: Hash, url: Link2, port: Server,
};
const sevStyle: Record<string, string> = {
  Critical: "text-primary border-primary/30 bg-primary/10",
  High:     "text-glow-amber border-glow-amber/30 bg-glow-amber/10",
  Medium:   "text-secondary border-secondary/30 bg-secondary/10",
  Low:      "text-glow-green border-glow-green/30 bg-glow-green/10",
  Info:     "text-muted-foreground border-border bg-muted/30",
};

const IOCs = () => {
  const [items, setItems] = useState<IOC[]>([]);
  const [q, setQ] = useState("");
  const [type, setType] = useState<"all" | IOCType>("all");
  const [draft, setDraft] = useState<{ type: IOCType; value: string }>({ type: "ip", value: "" });

  useEffect(() => { wireIncidentBus(); const u = subscribeIocs(setItems); return () => u(); }, []);

  const filtered = useMemo(() => items.filter((i) =>
    (type === "all" || i.type === type) &&
    (!q || i.value.toLowerCase().includes(q.toLowerCase()) || i.tags.some((t) => t.includes(q.toLowerCase())))
  ), [items, q, type]);

  const submit = () => {
    if (!draft.value.trim()) return;
    const ioc = addIoc({ type: draft.type, value: draft.value.trim(), severity: "Medium", source: "manual", tags: ["manual"] });
    toast.success(`${ioc.id} added to ledger`);
    setDraft({ type: draft.type, value: "" });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">IOC Ledger</h1>
          <p className="font-mono text-xs text-muted-foreground mt-1">Threat indicators auto-collected from scans, ports, and vulnerabilities</p>
        </div>
      </div>

      {/* stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {(["ip", "domain", "hash", "url", "port"] as IOCType[]).map((t) => {
          const Icon = typeIcon[t];
          const count = items.filter((i) => i.type === t).length;
          return (
            <button key={t} onClick={() => setType(type === t ? "all" : t)}
              className={`p-4 rounded-lg border text-left transition-colors ${type === t ? "border-primary/40 bg-primary/10" : "border-border/50 bg-card/50 hover:border-border"}`}>
              <Icon className="h-4 w-4 text-secondary mb-2" />
              <p className="text-xl font-bold text-foreground">{count}</p>
              <p className="font-mono text-xs text-muted-foreground uppercase">{t}</p>
            </button>
          );
        })}
      </div>

      {/* add + search */}
      <div className="rounded-lg border border-border/50 bg-card/50 p-4 flex flex-wrap gap-2 items-center">
        <select value={draft.type} onChange={(e) => setDraft({ ...draft, type: e.target.value as IOCType })}
          className="h-9 px-2 rounded bg-background border border-border/50 font-mono text-xs text-foreground">
          {(["ip", "domain", "hash", "url", "port"] as IOCType[]).map((t) => <option key={t} value={t}>{t.toUpperCase()}</option>)}
        </select>
        <Input value={draft.value} onChange={(e) => setDraft({ ...draft, value: e.target.value })}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="Add indicator (e.g. 185.220.101.42)" className="font-mono text-xs h-9 flex-1 min-w-[240px]" />
        <Button onClick={submit} className="font-mono text-xs h-9 bg-primary hover:bg-primary/90 text-primary-foreground">
          <Plus className="h-3 w-3 mr-1" /> Add IOC
        </Button>
        <div className="w-px h-6 bg-border/50 mx-1" />
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search value or tag…"
            className="font-mono text-xs h-9 pl-7" />
        </div>
      </div>

      {/* table */}
      <div className="rounded-lg border border-border/50 bg-card/50 overflow-hidden">
        <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-3 border-b border-border/50 font-mono text-xs text-muted-foreground uppercase tracking-wider">
          <div className="col-span-1">Type</div>
          <div className="col-span-4">Indicator</div>
          <div className="col-span-2">Severity</div>
          <div className="col-span-2">Source</div>
          <div className="col-span-2">Tags</div>
          <div className="col-span-1 text-right">Hits</div>
        </div>
        <div className="divide-y divide-border/30 max-h-[520px] overflow-y-auto">
          <AnimatePresence initial={false}>
            {filtered.map((ioc) => {
              const Icon = typeIcon[ioc.type];
              return (
                <motion.div key={ioc.id}
                  initial={{ opacity: 0, x: -10, backgroundColor: "hsl(var(--glow-cyan) / 0.08)" }}
                  animate={{ opacity: 1, x: 0, backgroundColor: "hsl(var(--glow-cyan) / 0)" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.4 }}
                  className="grid grid-cols-1 md:grid-cols-12 gap-4 px-4 py-3 items-center group">
                  <div className="md:col-span-1"><Icon className="h-4 w-4 text-muted-foreground" /></div>
                  <div className="md:col-span-4 min-w-0">
                    <p className="font-mono text-sm text-foreground truncate">{ioc.value}</p>
                    <p className="font-mono text-[10px] text-muted-foreground">{ioc.id}</p>
                  </div>
                  <div className="md:col-span-2">
                    <span className={`px-2 py-0.5 rounded text-xs font-mono border ${sevStyle[ioc.severity]}`}>{ioc.severity}</span>
                  </div>
                  <div className="md:col-span-2 font-mono text-xs text-muted-foreground truncate">{ioc.source}</div>
                  <div className="md:col-span-2 flex flex-wrap gap-1">
                    {ioc.tags.map((t) => (
                      <span key={t} className="px-1.5 py-0.5 rounded bg-muted/40 font-mono text-[10px] text-muted-foreground">{t}</span>
                    ))}
                  </div>
                  <div className="md:col-span-1 flex items-center justify-end gap-2">
                    <span className="font-mono text-xs text-foreground">{ioc.hits}</span>
                    <button onClick={() => { removeIoc(ioc.id); toast.success(`${ioc.id} removed`); }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-primary">
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
          {filtered.length === 0 && (
            <div className="p-8 text-center font-mono text-xs text-muted-foreground">
              <Fingerprint className="h-6 w-6 mx-auto mb-2 opacity-50" />
              No indicators match this filter.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default IOCs;
