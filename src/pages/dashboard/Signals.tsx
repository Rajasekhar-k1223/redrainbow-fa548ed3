import { motion } from "framer-motion";
import { Radio, Wifi, AlertTriangle, TrendingUp } from "lucide-react";

const signals = [
  { source: "Kali-01", type: "Port Scan", severity: "Medium", time: "2m ago", count: 342 },
  { source: "SECHub-03", type: "SQL Injection Attempt", severity: "High", time: "5m ago", count: 12 },
  { source: "SecOnion-02", type: "DNS Anomaly", severity: "Low", time: "8m ago", count: 1847 },
  { source: "Qubes-01", type: "Process Isolation Breach", severity: "Critical", time: "12m ago", count: 1 },
  { source: "REMnux-01", type: "Malware Callback", severity: "High", time: "18m ago", count: 7 },
  { source: "CAINE-01", type: "Disk Image Analysis", severity: "Info", time: "25m ago", count: 3 },
];

const severityColors: Record<string, string> = {
  Critical: "text-primary border-primary/30 bg-primary/10",
  High: "text-glow-amber border-glow-amber/30 bg-glow-amber/10",
  Medium: "text-secondary border-secondary/30 bg-secondary/10",
  Low: "text-glow-green border-glow-green/30 bg-glow-green/10",
  Info: "text-muted-foreground border-border bg-muted/30",
};

const Signals = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Signal Mesh</h1>
        <p className="font-mono text-xs text-muted-foreground mt-1">Real-time telemetry from all endpoints</p>
      </div>

      {/* Signal stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Signals", value: "2.4M", icon: Radio },
          { label: "Active Sources", value: "12", icon: Wifi },
          { label: "Alerts", value: "3", icon: AlertTriangle },
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
          {signals.map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.08 }}
              className="p-4 hover:bg-muted/20 transition-colors">
              <div className="flex items-center gap-4">
                <span className="font-mono text-xs text-secondary w-24 flex-shrink-0">{s.source}</span>
                <span className="text-sm text-foreground flex-1">{s.type}</span>
                <span className={`px-2 py-0.5 rounded text-xs font-mono border ${severityColors[s.severity]}`}>
                  {s.severity}
                </span>
                <span className="font-mono text-xs text-muted-foreground w-16 text-right">{s.count}</span>
                <span className="font-mono text-xs text-muted-foreground w-16 text-right">{s.time}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Signals;
