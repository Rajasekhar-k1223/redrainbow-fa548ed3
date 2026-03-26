import { motion } from "framer-motion";
import { Activity, Shield, Lock, Radio, Server, TrendingUp, AlertTriangle, CheckCircle } from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.5 } }),
};

const stats = [
  { label: "Active Missions", value: "7", change: "+2", icon: Shield, accent: "text-primary" },
  { label: "Signals Today", value: "2.4M", change: "+12%", icon: Radio, accent: "text-secondary" },
  { label: "Vault Items", value: "1,847", change: "+34", icon: Lock, accent: "text-glow-amber" },
  { label: "Active Nodes", value: "12", change: "0", icon: Server, accent: "text-glow-green" },
];

const recentActivity = [
  { time: "2m ago", event: "Kali node completed recon phase", type: "success" },
  { time: "8m ago", event: "Evidence sealed: packet_capture_0412.pcap", type: "info" },
  { time: "15m ago", event: "Alert: Anomalous egress on SECHub", type: "warning" },
  { time: "22m ago", event: "Purple drill #47 initiated", type: "success" },
  { time: "34m ago", event: "Vault integrity check passed", type: "info" },
  { time: "1h ago", event: "Telemetry stream reconnected (node 7)", type: "info" },
];

const Overview = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Operations Overview</h1>
        <p className="font-mono text-xs text-muted-foreground mt-1">Real-time command layer status</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <motion.div key={s.label} variants={fadeUp} custom={i} initial="hidden" animate="visible"
            className="p-5 rounded-lg border border-border/50 bg-card/50">
            <div className="flex items-center justify-between mb-3">
              <s.icon className={`h-5 w-5 ${s.accent}`} />
              <span className="font-mono text-xs text-glow-green flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />{s.change}
              </span>
            </div>
            <p className="text-2xl font-bold text-foreground">{s.value}</p>
            <p className="font-mono text-xs text-muted-foreground mt-1">{s.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Activity & Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <motion.div variants={fadeUp} custom={4} initial="hidden" animate="visible"
          className="p-6 rounded-lg border border-border/50 bg-card/50">
          <h2 className="text-lg font-bold text-foreground mb-4">Recent Activity</h2>
          <div className="space-y-3">
            {recentActivity.map((a, i) => (
              <div key={i} className="flex items-start gap-3 py-2 border-b border-border/30 last:border-0">
                {a.type === "warning" ? (
                  <AlertTriangle className="h-4 w-4 text-glow-amber mt-0.5 flex-shrink-0" />
                ) : (
                  <CheckCircle className="h-4 w-4 text-glow-green mt-0.5 flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground truncate">{a.event}</p>
                  <p className="font-mono text-xs text-muted-foreground">{a.time}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* System Status */}
        <motion.div variants={fadeUp} custom={5} initial="hidden" animate="visible"
          className="p-6 rounded-lg border border-border/50 bg-card/50">
          <h2 className="text-lg font-bold text-foreground mb-4">System Status</h2>
          <div className="space-y-4">
            {[
              { name: "Synaptic Hub", health: 98 },
              { name: "Telemetry Pipeline", health: 100 },
              { name: "Evidence Vault", health: 100 },
              { name: "Signal Mesh", health: 95 },
              { name: "Orchestration Engine", health: 99 },
            ].map((sys) => (
              <div key={sys.name} className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-foreground">{sys.name}</span>
                  <span className="font-mono text-xs text-glow-green">{sys.health}%</span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-1000"
                    style={{
                      width: `${sys.health}%`,
                      background: sys.health === 100
                        ? "hsl(var(--glow-green))"
                        : sys.health > 96
                        ? "hsl(var(--glow-cyan))"
                        : "hsl(var(--glow-amber))",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 p-3 rounded border border-border/50 bg-background/50 font-mono text-xs">
            <div className="flex items-center gap-2 text-muted-foreground">
              <span className="status-dot" />
              Pipeline Sync: <span className="text-glow-green">+2.4%</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Overview;
