import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Lock, FileText, Image, HardDrive, Clock, Shield, Search, Download, ArrowRightLeft } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { subscribeVault, setCustody, type VaultItem } from "@/lib/vaultStore";
import { useCan } from "@/lib/rbac";

const baseItems: VaultItem[] = [
  { id: "EV-2847", name: "packet_capture_0412.pcap", type: "Binary",     size: "24.7 MB", sealed: "2m ago",  hash: "a3f7...c9d2", custody: "Sealed" },
  { id: "EV-2846", name: "lateral_movement_log.json", type: "Log",        size: "1.2 MB",  sealed: "45m ago", hash: "b8e1...4f7a", custody: "Sealed" },
  { id: "EV-2845", name: "c2_screenshot_proof.png",   type: "Screenshot", size: "3.4 MB",  sealed: "1h ago",  hash: "d2c9...8b3e", custody: "In Review" },
  { id: "EV-2844", name: "memory_dump_qubes01.raw",   type: "Binary",     size: "512 MB",  sealed: "2h ago",  hash: "f1a3...7d6c", custody: "Sealed" },
  { id: "EV-2843", name: "incident_timeline.md",      type: "Document",   size: "28 KB",   sealed: "4h ago",  hash: "c7b2...1e9f", custody: "Transferred" },
  { id: "EV-2842", name: "malware_sample_x47.bin",    type: "Binary",     size: "847 KB",  sealed: "6h ago",  hash: "e4d8...3a5b", custody: "Sealed" },
];

const custodyStyle: Record<string, string> = {
  Sealed: "text-glow-green border-glow-green/30 bg-glow-green/10",
  "In Review": "text-glow-amber border-glow-amber/30 bg-glow-amber/10",
  Transferred: "text-secondary border-secondary/30 bg-secondary/10",
};

const custodyFlow: VaultItem["custody"][] = ["Sealed", "In Review", "Transferred"];
const nextCustody = (c: VaultItem["custody"]) =>
  custodyFlow[(custodyFlow.indexOf(c) + 1) % custodyFlow.length];

const iconFor = (type: string) =>
  type === "Log" || type === "Document" ? FileText : type === "Screenshot" ? Image : HardDrive;

type CustodyFilter = "All" | VaultItem["custody"];

const Vault = () => {
  const [live, setLive] = useState<VaultItem[]>([]);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<CustodyFilter>("All");
  const canTransfer = useCan("incident.advance");

  useEffect(() => { const unsub = subscribeVault(setLive); return () => { unsub(); }; }, []);

  const all = useMemo(() => [...live, ...baseItems], [live]);
  const liveIds = useMemo(() => new Set(live.map((i) => i.id)), [live]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return all.filter(
      (i) =>
        (filter === "All" || i.custody === filter) &&
        (!q || i.name.toLowerCase().includes(q) || i.id.toLowerCase().includes(q) || (i.source ?? "").toLowerCase().includes(q)),
    );
  }, [all, query, filter]);

  const exportManifest = () => {
    const rows = [
      ["id", "name", "type", "size", "hash", "sealed", "custody", "source"],
      ...visible.map((i) => [i.id, i.name, i.type, i.size, i.hash, i.sealed, i.custody, i.source ?? "seed"]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url; a.download = `chain_of_custody_manifest_${Date.now()}.csv`;
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
    toast.success(`Manifest exported — ${visible.length} artifacts`);
  };

  const advanceCustody = (item: VaultItem) => {
    const next = nextCustody(item.custody);
    setCustody(item.id, next);
    toast.info(`${item.id} custody → ${next}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Evidence Vault</h1>
          <p className="font-mono text-xs text-muted-foreground mt-1">Chain-of-custody storage with immutable time seals</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={exportManifest} variant="outline" className="font-mono text-xs h-9 border-secondary/40 text-secondary hover:bg-secondary/10">
            <Download className="h-3.5 w-3.5 mr-2" /> Export Manifest
          </Button>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded border border-glow-green/30 bg-glow-green/5">
            <Shield className="h-4 w-4 text-glow-green" />
            <span className="font-mono text-xs text-glow-green">Integrity: 99.999%</span>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Artifacts", value: all.length, tone: "text-foreground" },
          { label: "Sealed", value: all.filter((i) => i.custody === "Sealed").length, tone: "text-glow-green" },
          { label: "In Review", value: all.filter((i) => i.custody === "In Review").length, tone: "text-glow-amber" },
          { label: "Transferred", value: all.filter((i) => i.custody === "Transferred").length, tone: "text-secondary" },
        ].map((k) => (
          <div key={k.label} className="p-4 rounded-lg border border-border/50 bg-card/50">
            <Lock className="h-4 w-4 text-secondary mb-2" />
            <p className={`text-xl font-bold ${k.tone}`}>{k.value}</p>
            <p className="font-mono text-xs text-muted-foreground">{k.label}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)}
            placeholder="Search artifacts, IDs, or sources…" className="font-mono text-xs h-9 pl-8" />
        </div>
        <div className="flex items-center gap-1 rounded border border-border/50 bg-card/50 p-1">
          {(["All", ...custodyFlow] as CustodyFilter[]).map((c) => (
            <button key={c} onClick={() => setFilter(c)}
              className={`px-2 py-1 rounded font-mono text-[10px] transition-colors ${filter === c ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground"}`}>
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-border/50 bg-card/50 overflow-hidden">
        <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-3 border-b border-border/50 font-mono text-xs text-muted-foreground uppercase tracking-wider">
          <div className="col-span-4">Filename</div>
          <div className="col-span-2">Type / Size</div>
          <div className="col-span-2">Hash (SHA-256)</div>
          <div className="col-span-1">Sealed</div>
          <div className="col-span-3 text-right">Custody Status</div>
        </div>
        <div className="divide-y divide-border/30">
          {visible.map((item, i) => {
            const Icon = iconFor(item.type);
            return (
              <motion.div key={item.id} initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: Math.min(i, 8) * 0.04 }}
                className="grid grid-cols-1 md:grid-cols-12 gap-4 px-4 py-3 hover:bg-muted/20 transition-colors items-center">
                <div className="md:col-span-4 flex items-center gap-3 min-w-0">
                  <Icon className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{item.name}</p>
                    <p className="font-mono text-xs text-muted-foreground">
                      {item.id}{item.source ? ` · ${item.source}` : ""}
                    </p>
                  </div>
                </div>
                <div className="md:col-span-2 font-mono text-xs text-muted-foreground">
                  <span className="text-foreground">{item.type}</span> · {item.size}
                </div>
                <div className="md:col-span-2 flex items-center gap-2">
                  <Lock className="h-3 w-3 text-glow-green flex-shrink-0" />
                  <span className="font-mono text-xs text-secondary truncate">{item.hash}</span>
                </div>
                <div className="md:col-span-1 font-mono text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" /> {item.sealed}
                </div>
                <div className="md:col-span-3 flex md:justify-end items-center gap-2">
                  <span className={`inline-block px-2 py-0.5 rounded text-xs font-mono border ${custodyStyle[item.custody]}`}>
                    {item.custody}
                  </span>
                  {liveIds.has(item.id) && (
                    <button onClick={() => advanceCustody(item)} disabled={!canTransfer}
                      className="font-mono text-[10px] px-2 py-0.5 rounded border border-border/50 text-muted-foreground hover:text-foreground hover:border-secondary/40 transition-colors disabled:opacity-40 inline-flex items-center gap-1"
                      title="Advance chain-of-custody">
                      <ArrowRightLeft className="h-3 w-3" /> {nextCustody(item.custody)}
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
          {visible.length === 0 && (
            <div className="p-8 text-center font-mono text-xs text-muted-foreground">No artifacts match this filter.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Vault;
