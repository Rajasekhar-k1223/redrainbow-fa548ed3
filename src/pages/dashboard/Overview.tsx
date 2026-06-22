import { motion } from "framer-motion";
import { Shield, Radio, AlertOctagon, TrendingUp, Activity } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.06, duration: 0.5 } }),
};

const metrics = [
  { label: "Threat Intel", value: "2.4M", unit: "signals/day", icon: Radio, accent: "text-secondary" },
  { label: "Global Posture Score", value: "A", unit: "98% verified", icon: Shield, accent: "text-glow-green" },
  { label: "Open Vulnerabilities", value: "14", unit: "3 critical", icon: AlertOctagon, accent: "text-primary" },
  { label: "Mean Time to Detect", value: "42s", unit: "−18% wk", icon: TrendingUp, accent: "text-glow-cyan" },
];

const signalMesh = [
  { source: "CrowdStrike Falcon", events: 482_311, latency: "12ms", status: "Live" },
  { source: "SentinelOne", events: 318_904, latency: "18ms", status: "Live" },
  { source: "Splunk Enterprise", events: 1_204_882, latency: "44ms", status: "Live" },
  { source: "Cloudflare Edge", events: 891_271, latency: "8ms", status: "Live" },
  { source: "VirusTotal Intel", events: 14_872, latency: "210ms", status: "Live" },
  { source: "Wazuh SIEM", events: 92_338, latency: "31ms", status: "Degraded" },
];

const topExposures = [
  { cve: "CVE-2024-3094", title: "xz-utils backdoor", cvss: "10.0", asset: "k8s-sechub-cluster" },
  { cve: "CVE-2024-4577", title: "PHP CGI argument injection", cvss: "9.8", asset: "edge-gateway-07" },
  { cve: "CVE-2024-21762", title: "FortiOS out-of-bounds write", cvss: "9.6", asset: "fw-perimeter-01" },
  { cve: "CVE-2024-1086", title: "Linux netfilter UAF", cvss: "7.8", asset: "bastion-mgmt-02" },
  { cve: "CVE-2024-27198", title: "TeamCity auth bypass", cvss: "9.8", asset: "ci.redrain.sec" },
];

const threatTrend = Array.from({ length: 24 }, (_, i) => ({
  t: `${String(i).padStart(2, "0")}:00`,
  ingress: Math.round(40 + Math.sin(i / 3) * 25 + Math.random() * 18),
  threats: Math.round(8 + Math.cos(i / 4) * 6 + Math.random() * 5),
}));

const Overview = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Executive Cockpit</h1>
        <p className="font-mono text-xs text-muted-foreground mt-1">Continuous threat exposure management overview</p>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m, i) => (
          <motion.div key={m.label} variants={fadeUp} custom={i} initial="hidden" animate="visible"
            className="p-5 rounded-lg border border-border/50 bg-card/50 backdrop-blur-xl relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />
            <div className="flex items-center justify-between mb-3">
              <m.icon className={`h-5 w-5 ${m.accent}`} />
              <Activity className="h-3 w-3 text-muted-foreground" />
            </div>
            <p className="font-mono text-xs text-muted-foreground uppercase tracking-wider">{m.label}</p>
            <p className="text-3xl font-black text-foreground mt-1">{m.value}</p>
            <p className="font-mono text-xs text-muted-foreground mt-1">{m.unit}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Threat Trend Chart */}
        <motion.div variants={fadeUp} custom={4} initial="hidden" animate="visible"
          className="lg:col-span-2 rounded-lg border border-border/50 bg-card/50 overflow-hidden">
          <div className="p-4 border-b border-border/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-secondary" />
              <h2 className="text-sm font-bold text-foreground">24h Ingress vs Threat Signals</h2>
            </div>
            <div className="flex items-center gap-3 font-mono text-[10px] text-muted-foreground uppercase tracking-wider">
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm bg-secondary" /> Ingress</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm bg-primary" /> Threats</span>
            </div>
          </div>
          <div className="h-[260px] p-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={threatTrend} margin={{ top: 10, right: 16, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="gIngress" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--glow-cyan))" stopOpacity={0.6} />
                    <stop offset="100%" stopColor="hsl(var(--glow-cyan))" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gThreats" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.6} />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="hsl(var(--border))" strokeOpacity={0.25} vertical={false} />
                <XAxis dataKey="t" stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 10, fontFamily: "monospace" }} tickLine={false} axisLine={false} interval={3} />
                <YAxis stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 10, fontFamily: "monospace" }} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 6, fontFamily: "monospace", fontSize: 11 }}
                  labelStyle={{ color: "hsl(var(--muted-foreground))" }}
                />
                <Area type="monotone" dataKey="ingress" stroke="hsl(var(--glow-cyan))" strokeWidth={1.5} fill="url(#gIngress)" />
                <Area type="monotone" dataKey="threats" stroke="hsl(var(--primary))" strokeWidth={1.5} fill="url(#gThreats)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="divide-y divide-border/30 border-t border-border/50">
            {signalMesh.slice(0, 4).map((s) => (
              <div key={s.source} className="px-4 py-2.5 hover:bg-muted/20 grid grid-cols-12 gap-2 items-center">
                <div className="col-span-5 flex items-center gap-2">
                  <span className={`w-1.5 h-1.5 rounded-full ${s.status === "Live" ? "bg-glow-green" : "bg-glow-amber"}`} style={{ boxShadow: `0 0 6px hsl(var(--glow-${s.status === "Live" ? "green" : "amber"}))` }} />
                  <span className="font-mono text-xs text-foreground">{s.source}</span>
                </div>
                <span className="col-span-4 font-mono text-xs text-muted-foreground">{s.events.toLocaleString()} events</span>
                <span className="col-span-2 font-mono text-xs text-secondary">{s.latency}</span>
                <span className={`col-span-1 font-mono text-xs text-right ${s.status === "Live" ? "text-glow-green" : "text-glow-amber"}`}>{s.status}</span>
              </div>
            ))}
          </div>
        </motion.div>


        {/* Top Exposures */}
        <motion.div variants={fadeUp} custom={5} initial="hidden" animate="visible"
          className="rounded-lg border border-border/50 bg-card/50 overflow-hidden">
          <div className="p-4 border-b border-border/50 flex items-center gap-2">
            <AlertOctagon className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-bold text-foreground">Top Exposures</h2>
          </div>
          <div className="divide-y divide-border/30">
            {topExposures.map((e) => (
              <div key={e.cve} className="p-3 hover:bg-muted/20">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-primary">{e.cve}</span>
                  <span className="font-mono text-xs text-glow-amber">CVSS {e.cvss}</span>
                </div>
                <p className="text-sm text-foreground mt-1 truncate">{e.title}</p>
                <p className="font-mono text-xs text-muted-foreground mt-1 truncate">→ {e.asset}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Overview;
