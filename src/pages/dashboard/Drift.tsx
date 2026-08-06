import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Activity, ArrowDownRight, ArrowUpRight, Camera, Check, Download, Globe,
  Cloud, Network, RefreshCw, ShieldAlert, FileBadge2, Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  acknowledgeDrift, captureBaseline, clearDrift, downloadDriftCsv, getCurrentSurface,
  getDrift, getSnapshots, runSurfaceSweep, subscribeDrift,
  type DriftEvent, type DriftType, type SurfaceKind,
} from "@/lib/driftStore";
import { useCan } from "@/lib/rbac";
import { useEffect } from "react";

const kindIcon: Record<SurfaceKind, typeof Globe> = {
  subdomain: Globe,
  port: Network,
  certificate: FileBadge2,
  cloud: Cloud,
};

const sevColors: Record<string, string> = {
  Critical: "text-primary border-primary/30 bg-primary/10",
  High: "text-glow-amber border-glow-amber/30 bg-glow-amber/10",
  Medium: "text-secondary border-secondary/30 bg-secondary/10",
  Low: "text-muted-foreground border-border bg-muted/30",
  Info: "text-muted-foreground border-border bg-muted/30",
};

const typeMeta: Record<DriftType, { label: string; className: string; Icon: typeof ArrowUpRight }> = {
  added: { label: "ADDED", className: "text-glow-amber", Icon: ArrowUpRight },
  removed: { label: "REMOVED", className: "text-muted-foreground", Icon: ArrowDownRight },
  changed: { label: "CHANGED", className: "text-secondary", Icon: RefreshCw },
};

const Drift = () => {
  const [, force] = useState(0);
  const [query, setQuery] = useState("");
  const [kindFilter, setKindFilter] = useState<"all" | SurfaceKind>("all");
  const [typeFilter, setTypeFilter] = useState<"all" | DriftType>("all");
  const [sweeping, setSweeping] = useState(false);
  const canClear = useCan("vault.clear");

  useEffect(() => subscribeDrift(() => force((n) => n + 1)), []);

  const drift = getDrift();
  const snapshots = getSnapshots();
  const surface = getCurrentSurface();

  const filtered = useMemo(() => drift.filter((d) => {
    if (kindFilter !== "all" && d.kind !== kindFilter) return false;
    if (typeFilter !== "all" && d.type !== typeFilter) return false;
    if (query && !`${d.id} ${d.label} ${d.detail}`.toLowerCase().includes(query.toLowerCase())) return false;
    return true;
  }), [drift, kindFilter, typeFilter, query]);

  const kpis = [
    { label: "Surface Entities", value: surface.length, hint: "tracked assets", icon: Activity },
    { label: "Drift Events", value: drift.length, hint: "since baseline", icon: RefreshCw },
    { label: "Unacknowledged", value: drift.filter((d) => !d.acknowledged).length, hint: "needs triage", icon: ShieldAlert },
    { label: "Snapshots", value: snapshots.length, hint: "versioned states", icon: Camera },
  ];

  const sweep = () => {
    setSweeping(true);
    const id = toast.loading("Attack surface sweep running…", { description: "Diffing subdomains, ports, certificates, cloud assets." });
    setTimeout(() => {
      const events = runSurfaceSweep();
      setSweeping(false);
      if (events.length) {
        toast.warning(`${events.length} surface change${events.length > 1 ? "s" : ""} detected`, { id, description: events.slice(0, 3).map((e) => `${e.type}: ${e.label}`).join(" · ") });
      } else {
        toast.success("No drift detected", { id, description: "Surface matches previous snapshot." });
      }
    }, 1400);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Attack Surface Drift</h1>
          <p className="font-mono text-xs text-muted-foreground mt-1">
            Versioned surface snapshots with change detection across subdomains, ports, certificates, and cloud accounts
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={sweep} disabled={sweeping} size="sm" variant="outline"
            className="font-mono text-xs border-primary/40 text-primary hover:bg-primary/10 hover:text-primary">
            <RefreshCw className={`h-3 w-3 mr-2 ${sweeping ? "animate-spin" : ""}`} /> Run Surface Sweep
          </Button>
          <Button onClick={() => { captureBaseline(); toast.success("Baseline snapshot captured"); }} size="sm" variant="outline"
            className="font-mono text-xs border-secondary/40 text-secondary hover:bg-secondary/10 hover:text-secondary">
            <Camera className="h-3 w-3 mr-2" /> Capture Baseline
          </Button>
          <Button onClick={() => downloadDriftCsv(filtered)} size="sm" variant="outline" className="font-mono text-xs border-border">
            <Download className="h-3 w-3 mr-2" /> Export CSV
          </Button>
          {canClear && (
            <Button onClick={() => { clearDrift(); toast.success("Drift ledger reset"); }} size="sm" variant="outline"
              className="font-mono text-xs border-border text-muted-foreground">
              <Trash2 className="h-3 w-3 mr-2" /> Reset
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k) => (
          <div key={k.label} className="rounded-lg border border-border/50 bg-card/50 p-4">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{k.label}</span>
              <k.icon className="h-4 w-4 text-secondary" />
            </div>
            <div className="mt-2 font-mono text-2xl font-bold text-foreground">{k.value}</div>
            <div className="font-mono text-[10px] text-muted-foreground">{k.hint}</div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search drift events..."
          className="max-w-xs bg-card/50 border-border/50 font-mono text-sm" />
        {(["all", "subdomain", "port", "certificate", "cloud"] as const).map((k) => (
          <button key={k} onClick={() => setKindFilter(k)}
            className={`px-2.5 py-1 rounded font-mono text-[11px] border transition-colors ${kindFilter === k ? "border-primary/40 bg-primary/10 text-primary" : "border-border/50 text-muted-foreground hover:text-foreground"}`}>
            {k.toUpperCase()}
          </button>
        ))}
        <span className="mx-1 h-4 w-px bg-border" />
        {(["all", "added", "changed", "removed"] as const).map((t) => (
          <button key={t} onClick={() => setTypeFilter(t)}
            className={`px-2.5 py-1 rounded font-mono text-[11px] border transition-colors ${typeFilter === t ? "border-secondary/40 bg-secondary/10 text-secondary" : "border-border/50 text-muted-foreground hover:text-foreground"}`}>
            {t.toUpperCase()}
          </button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-lg border border-border/50 bg-card/50">
          <div className="px-4 py-3 border-b border-border/50 flex items-center justify-between">
            <span className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">Change Timeline</span>
            <span className="font-mono text-[10px] text-muted-foreground">{filtered.length} event(s)</span>
          </div>
          <div className="divide-y divide-border/30 max-h-[560px] overflow-y-auto">
            {filtered.length === 0 && (
              <div className="p-8 text-center font-mono text-xs text-muted-foreground">
                No drift recorded. Run a surface sweep to compare against the last snapshot.
              </div>
            )}
            {filtered.map((d: DriftEvent, i) => {
              const Icon = kindIcon[d.kind];
              const meta = typeMeta[d.type];
              return (
                <motion.div key={d.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i * 0.03, 0.4) }}
                  className="px-4 py-3 hover:bg-muted/20 transition-colors">
                  <div className="flex items-start gap-3">
                    <Icon className="h-4 w-4 mt-0.5 text-secondary flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs text-muted-foreground">{d.id}</span>
                        <span className={`font-mono text-[10px] tracking-wider ${meta.className}`}>
                          <meta.Icon className="inline h-3 w-3 mr-1" />{meta.label}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono border ${sevColors[d.severity]}`}>{d.severity}</span>
                        <span className="font-mono text-[10px] text-muted-foreground ml-auto">{new Date(d.at).toLocaleString()}</span>
                      </div>
                      <div className="font-mono text-sm text-foreground mt-1 truncate">{d.label}</div>
                      <div className="font-mono text-[11px] text-muted-foreground">{d.detail}</div>
                      {d.before && d.after && (
                        <div className="font-mono text-[10px] text-muted-foreground mt-1">
                          <span className="text-muted-foreground/70">{d.before}</span> → <span className="text-secondary">{d.after}</span>
                        </div>
                      )}
                    </div>
                    {d.acknowledged ? (
                      <span className="font-mono text-[10px] text-glow-green flex items-center gap-1"><Check className="h-3 w-3" /> ACK</span>
                    ) : (
                      <Button onClick={() => acknowledgeDrift(d.id)} size="sm" variant="ghost" className="font-mono text-[10px] h-7">
                        Acknowledge
                      </Button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-lg border border-border/50 bg-card/50">
            <div className="px-4 py-3 border-b border-border/50 font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Current Surface
            </div>
            <div className="divide-y divide-border/30 max-h-[260px] overflow-y-auto">
              {surface.map((e) => {
                const Icon = kindIcon[e.kind];
                return (
                  <div key={e.key} className="px-4 py-2 flex items-start gap-2">
                    <Icon className="h-3.5 w-3.5 mt-0.5 text-muted-foreground flex-shrink-0" />
                    <div className="min-w-0">
                      <div className="font-mono text-xs text-foreground truncate">{e.label}</div>
                      <div className="font-mono text-[10px] text-muted-foreground truncate">{e.detail}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-lg border border-border/50 bg-card/50">
            <div className="px-4 py-3 border-b border-border/50 font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Snapshot History
            </div>
            <div className="divide-y divide-border/30 max-h-[220px] overflow-y-auto">
              {snapshots.length === 0 && (
                <div className="px-4 py-6 text-center font-mono text-[11px] text-muted-foreground">No snapshots yet.</div>
              )}
              {snapshots.map((s) => (
                <div key={`${s.id}-${s.at}`} className="px-4 py-2 flex items-center justify-between">
                  <span className="font-mono text-xs text-foreground">{s.id}</span>
                  <span className="font-mono text-[10px] text-muted-foreground">{s.entities.length} entities · {new Date(s.at).toLocaleTimeString()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Drift;
