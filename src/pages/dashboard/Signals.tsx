import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Radio, Wifi, AlertTriangle, TrendingUp, Rocket } from "lucide-react";
import { toast } from "sonner";
import { bus, busIds, useBusEvent, type Severity } from "@/lib/eventBus";
import { useCan } from "@/lib/rbac";

type Signal = { id: string; source: string; type: string; severity: Severity | "Info"; time: string; count: number };

const seedSignals: Signal[] = [
  { id: "SIG-10001", source: "Kali-01",     type: "Port Scan",                 severity: "Medium",   time: "2m ago",  count: 342 },
  { id: "SIG-10002", source: "SECHub-03",   type: "SQL Injection Attempt",     severity: "High",     time: "5m ago",  count: 12 },
  { id: "SIG-10003", source: "SecOnion-02", type: "DNS Anomaly",               severity: "Low",      time: "8m ago",  count: 1847 },
  { id: "SIG-10004", source: "Qubes-01",    type: "Process Isolation Breach",  severity: "Critical", time: "12m ago", count: 1 },
  { id: "SIG-10005", source: "REMnux-01",   type: "Malware Callback",          severity: "High",     time: "18m ago", count: 7 },
  { id: "SIG-10006", source: "CAINE-01",    type: "Disk Image Analysis",       severity: "Info",     time: "25m ago", count: 3 },
];

const severityColors: Record<string, string> = {
  Critical: "text-primary border-primary/30 bg-primary/10",
  High: "text-glow-amber border-glow-amber/30 bg-glow-amber/10",
  Medium: "text-secondary border-secondary/30 bg-secondary/10",
  Low: "text-glow-green border-glow-green/30 bg-glow-green/10",
  Info: "text-muted-foreground border-border bg-muted/30",
};

const Signals = () => {
  const [signals, setSignals] = useState<Signal[]>(seedSignals);
  const canLaunch = useCan("mission.launch");

  const pushSignal = (partial: Omit<Signal, "id" | "time">, cause?: Parameters<typeof bus.emit>[0]) => {
    const sig: Signal = { id: busIds.signal(), time: "just now", ...partial };
    setSignals((prev) => [sig, ...prev].slice(0, 40));
    bus.emit("signal.created", {
      id: sig.id, source: sig.source, type: sig.type,
      severity: (sig.severity === "Info" ? "Low" : sig.severity) as Severity,
      count: sig.count, cause,
    });
  };

  useBusEvent("asset.scan.completed", (p) => {
    pushSignal({ source: `Scan/${p.kind}`, type: `Scan finished on ${p.target}`, severity: "Medium", count: p.hostsFound }, "asset.scan.completed");
  });
  useBusEvent("port.discovered", (p) => {
    if (!p.unexpected) return;
    pushSignal({ source: p.host, type: `Unexpected ${p.service} (:${p.port})`, severity: "High", count: 1 }, "port.discovered");
  });
  useBusEvent("vulnerability.detected", (p) => {
    pushSignal({ source: p.asset, type: p.cve ? `${p.cve} — ${p.title}` : p.title, severity: p.severity, count: 1 }, "vulnerability.detected");
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Signal Mesh</h1>
        <p className="font-mono text-xs text-muted-foreground mt-1">Real-time telemetry from all endpoints</p>
      </div>

      {/* Signal stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Signals", value: signals.length >= 1000 ? "2.4M" : String(signals.length), icon: Radio },
          { label: "Active Sources", value: "12", icon: Wifi },
          { label: "Alerts", value: String(signals.filter((s) => s.severity === "Critical" || s.severity === "High").length), icon: AlertTriangle },
          { label: "Throughput", value: "+12%", icon: TrendingUp },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="p-4 rounded-lg border border-border/50 bg-card/50">
            <s.icon className="h-4 w-4 text-secondary mb-2" />
            <p className="text-xl font-bold text-foreground">{s.value}</p>
            <p className="font-mono text-xs text-muted-foreground">{s.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Signal feed */}
      <div className="rounded-lg border border-border/50 bg-card/50 overflow-hidden">
        <div className="p-4 border-b border-border/50 flex items-center gap-2">
          <span className="status-dot" />
          <span className="font-mono text-xs text-muted-foreground">LIVE FEED</span>
        </div>
        <div className="divide-y divide-border/30">
          <AnimatePresence initial={false}>
            {signals.map((s) => (
              <motion.div key={s.id}
                initial={{ opacity: 0, x: -12, backgroundColor: "hsl(var(--glow-cyan) / 0.08)" }}
                animate={{ opacity: 1, x: 0, backgroundColor: "hsl(var(--glow-cyan) / 0)" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.45 }}
                className="p-4 hover:bg-muted/20 transition-colors">
                <div className="flex items-center gap-4">
                  <span className="font-mono text-xs text-secondary w-24 flex-shrink-0">{s.source}</span>
                  <span className="text-sm text-foreground flex-1">{s.type}</span>
                  <span className={`px-2 py-0.5 rounded text-xs font-mono border ${severityColors[s.severity]}`}>
                    {s.severity}
                  </span>
                  <span className="font-mono text-xs text-muted-foreground w-14 text-right">{s.count}</span>
                  <span className="font-mono text-xs text-muted-foreground w-16 text-right">{s.time}</span>
                  {canLaunch && (s.severity === "Critical" || s.severity === "High") && (
                    <button
                      onClick={() => {
                        const mid = busIds.mission();
                        const team = s.severity === "Critical" ? "Blue Team Alpha" : "Purple Cell";
                        bus.emit("mission.created", {
                          id: mid,
                          name: `Playbook: ${s.type}`,
                          type: s.severity === "Critical" ? "Blue" : "Purple",
                          team,
                          origin: s.id,
                        });
                        bus.emit("mission.started", { id: mid, startedAt: Date.now() });
                        toast.success(`Mission ${mid} dispatched → ${team}`);
                      }}
                      className="flex items-center gap-1.5 px-2 py-1 rounded border border-primary/40 bg-primary/10 hover:bg-primary/20 transition-colors font-mono text-[10px] text-primary tracking-wider"
                      aria-label="Launch playbook"
                    >
                      <Rocket className="h-3 w-3" />
                      LAUNCH
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default Signals;
