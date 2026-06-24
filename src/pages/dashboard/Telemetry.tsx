import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Activity, Key, Plus, Copy, ShieldAlert, Cpu, Bug } from "lucide-react";
import { Button } from "@/components/ui/button";

type Event = { time: string; source: string; type: string; msg: string; sev: string; icon: typeof ShieldAlert; uid: number };

const seed: Event[] = [
  { time: "12:04:32", source: "CrowdStrike", type: "Network Anomaly", msg: "C2 Connection Blocked → 185.220.x.x", sev: "Critical", icon: ShieldAlert, uid: 1 },
  { time: "12:04:18", source: "SentinelOne", type: "Process Anomaly", msg: "Rapid Encryption Detected on host WIN-DC07", sev: "Critical", icon: Cpu, uid: 2 },
  { time: "12:03:55", source: "VirusTotal", type: "Malware", msg: "Hash match: Emotet 4a8f...c91b", sev: "High", icon: Bug, uid: 3 },
  { time: "12:03:41", source: "Defender", type: "Auth", msg: "Impossible travel: ops@redrain.sec", sev: "Medium", icon: ShieldAlert, uid: 4 },
  { time: "12:03:12", source: "Suricata", type: "IDS", msg: "ET POLICY DNS tunneling pattern", sev: "Medium", icon: Activity, uid: 5 },
  { time: "12:02:48", source: "Wazuh", type: "FIM", msg: "/etc/shadow modified on bastion-mgmt-02", sev: "High", icon: ShieldAlert, uid: 6 },
  { time: "12:02:21", source: "CrowdStrike", type: "EDR", msg: "Suspicious child process: powershell -enc", sev: "High", icon: Cpu, uid: 7 },
  { time: "12:01:59", source: "Cloudflare", type: "WAF", msg: "1,247 SQLi attempts blocked /api/login", sev: "Low", icon: Activity, uid: 8 },
];

const pool: Omit<Event, "time" | "uid">[] = [
  { source: "CrowdStrike", type: "EDR", msg: "Lateral movement attempt blocked (SMB)", sev: "High", icon: ShieldAlert },
  { source: "Suricata", type: "IDS", msg: "Cobalt Strike beacon signature 0x7f", sev: "Critical", icon: Activity },
  { source: "Wazuh", type: "FIM", msg: "Unexpected binary in /usr/local/bin", sev: "Medium", icon: ShieldAlert },
  { source: "VirusTotal", type: "Malware", msg: "Hash match: AgentTesla variant", sev: "High", icon: Bug },
  { source: "Cloudflare", type: "WAF", msg: "Rate limit triggered on /api/auth", sev: "Low", icon: Activity },
  { source: "Defender", type: "Auth", msg: "MFA fatigue pattern: 14 prompts in 90s", sev: "High", icon: ShieldAlert },
  { source: "SentinelOne", type: "Process", msg: "LSASS memory access by unknown PID", sev: "Critical", icon: Cpu },
];


const sevColors: Record<string, string> = {
  Critical: "text-primary border-primary/40 bg-primary/10",
  High: "text-glow-amber border-glow-amber/40 bg-glow-amber/10",
  Medium: "text-secondary border-secondary/40 bg-secondary/10",
  Low: "text-muted-foreground border-border bg-muted/30",
};

const apiKeys = [
  { name: "CrowdStrike Falcon", key: "cs_live_••••••••••••a91f", created: "Mar 2026", scope: "EDR + IOC" },
  { name: "SentinelOne", key: "s1_••••••••••••7c2e", created: "Feb 2026", scope: "Endpoint" },
  { name: "VirusTotal Enterprise", key: "vt_••••••••••••b48d", created: "Jan 2026", scope: "Intel" },
  { name: "Cloudflare Logpush", key: "cf_••••••••••••3f6a", created: "Dec 2025", scope: "Edge + WAF" },
];

const Telemetry = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Monitorix Telemetry & Integrations</h1>
        <p className="font-mono text-xs text-muted-foreground mt-1">Live signal stream from EDR, IDS, WAF, and threat intel platforms</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-lg border border-border/50 bg-card/50 overflow-hidden">
          <div className="p-4 border-b border-border/50 flex items-center gap-2">
            <span className="status-dot" />
            <span className="font-mono text-xs text-muted-foreground">LIVE TELEMETRY STREAM</span>
            <span className="ml-auto font-mono text-xs text-glow-cyan">2,418 events/sec</span>
          </div>
          <div className="divide-y divide-border/30 max-h-[600px] overflow-auto">
            {stream.map((s, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                className="p-3 hover:bg-muted/20 flex items-start gap-3">
                <s.icon className="h-4 w-4 text-secondary mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs text-muted-foreground">{s.time}</span>
                    <span className="font-mono text-xs text-secondary">{s.source}</span>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono border ${sevColors[s.sev]}`}>{s.sev}</span>
                    <span className="font-mono text-xs text-muted-foreground">{s.type}</span>
                  </div>
                  <p className="text-sm text-foreground mt-1">{s.msg}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-lg border border-border/50 bg-card/50 p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Key className="h-4 w-4 text-primary" />
                <h2 className="text-sm font-bold text-foreground">API Keys</h2>
              </div>
              <Button size="sm" variant="ghost" className="h-7 text-xs font-mono text-secondary hover:text-secondary">
                <Plus className="h-3 w-3 mr-1" /> New
              </Button>
            </div>
            <div className="space-y-3">
              {apiKeys.map((k) => (
                <div key={k.name} className="p-3 rounded border border-border/50 bg-background/40">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">{k.name}</span>
                    <Copy className="h-3 w-3 text-muted-foreground cursor-pointer hover:text-foreground" />
                  </div>
                  <p className="font-mono text-xs text-secondary mt-1 truncate">{k.key}</p>
                  <div className="flex items-center justify-between mt-2 font-mono text-xs text-muted-foreground">
                    <span>{k.scope}</span>
                    <span>{k.created}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Telemetry;
