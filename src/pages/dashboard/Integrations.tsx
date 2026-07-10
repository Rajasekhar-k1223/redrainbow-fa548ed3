import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Plug, CheckCircle2, XCircle, AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { subscribeIntegrations, toggleIntegration, type Integration } from "@/lib/settingsStore";

const statusStyle: Record<Integration["status"], string> = {
  Connected:    "text-glow-green border-glow-green/30 bg-glow-green/10",
  Disconnected: "text-muted-foreground border-border bg-muted/20",
  Error:        "text-primary border-primary/30 bg-primary/10",
};
const statusIcon: Record<Integration["status"], React.ComponentType<{ className?: string }>> = {
  Connected: CheckCircle2, Disconnected: XCircle, Error: AlertTriangle,
};

const Integrations = () => {
  const [items, setItems] = useState<Integration[]>([]);
  useEffect(() => { const u = subscribeIntegrations(setItems); return () => u(); }, []);

  const grouped = useMemo(() => {
    const map = new Map<Integration["category"], Integration[]>();
    items.forEach((i) => {
      const bucket = map.get(i.category) ?? [];
      bucket.push(i); map.set(i.category, bucket);
    });
    return map;
  }, [items]);

  const stats = {
    connected: items.filter((i) => i.status === "Connected").length,
    total:     items.length,
    errors:    items.filter((i) => i.status === "Error").length,
  };

  const toggle = (i: Integration) => {
    toggleIntegration(i.id);
    toast.success(`${i.name} ${i.status === "Connected" ? "disconnected" : "connected"}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Integrations</h1>
          <p className="font-mono text-xs text-muted-foreground mt-1">Downstream systems the cockpit talks to</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 rounded border border-glow-green/40 bg-glow-green/10 font-mono text-xs text-glow-green">
            {stats.connected}/{stats.total} connected
          </div>
          {stats.errors > 0 && (
            <div className="px-3 py-1.5 rounded border border-primary/40 bg-primary/10 font-mono text-xs text-primary">
              {stats.errors} error{stats.errors > 1 ? "s" : ""}
            </div>
          )}
        </div>
      </div>

      {[...grouped.entries()].map(([category, list]) => (
        <div key={category}>
          <h2 className="font-mono text-xs text-muted-foreground uppercase tracking-wider mb-3">{category}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {list.map((i, idx) => {
              const Icon = statusIcon[i.status];
              return (
                <motion.div key={i.id}
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.04 }}
                  className="p-4 rounded-lg border border-border/50 bg-card/50 flex flex-col gap-3">
                  <div className="flex items-start gap-3">
                    <Plug className="h-5 w-5 text-secondary flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{i.name}</p>
                      <p className="font-mono text-[10px] text-muted-foreground">{i.id}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono border flex items-center gap-1 ${statusStyle[i.status]}`}>
                      <Icon className="h-3 w-3" /> {i.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] text-muted-foreground">
                      {i.lastSync ? `synced ${i.lastSync}` : "never synced"}
                    </span>
                    <div className="flex items-center gap-1">
                      {i.status === "Error" && (
                        <Button size="sm" variant="ghost" onClick={() => { toggleIntegration(i.id); toast.success(`${i.name} retried`); }}
                          className="h-7 font-mono text-[10px] text-glow-amber hover:text-glow-amber">
                          <RefreshCw className="h-3 w-3 mr-1" /> Retry
                        </Button>
                      )}
                      <Button size="sm" onClick={() => toggle(i)}
                        className={`h-7 font-mono text-[10px] ${i.status === "Connected"
                          ? "bg-muted/40 text-muted-foreground hover:bg-muted/60"
                          : "bg-primary/10 text-primary border border-primary/40 hover:bg-primary/20"}`}>
                        {i.status === "Connected" ? "Disconnect" : "Connect"}
                      </Button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

export default Integrations;
