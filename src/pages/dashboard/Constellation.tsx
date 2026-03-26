import { motion } from "framer-motion";
import { Server, Wifi, WifiOff, Cpu, MemoryStick } from "lucide-react";

const nodes = [
  { name: "Kali", role: "Red Team", status: "Online", cpu: 42, mem: 67, ip: "10.0.1.10", uptime: "7d 12h" },
  { name: "Security Onion", role: "Blue Team", status: "Online", cpu: 28, mem: 54, ip: "10.0.2.10", uptime: "14d 3h" },
  { name: "Qubes", role: "Isolation", status: "Online", cpu: 15, mem: 32, ip: "10.0.3.10", uptime: "5d 8h" },
  { name: "REMnux", role: "Malware", status: "Online", cpu: 78, mem: 89, ip: "10.0.4.10", uptime: "2d 16h" },
  { name: "SECHub", role: "Web App", status: "Maintenance", cpu: 0, mem: 12, ip: "10.0.5.10", uptime: "0h" },
  { name: "CAINE", role: "Forensics", status: "Online", cpu: 35, mem: 48, ip: "10.0.6.10", uptime: "9d 1h" },
];

const Constellation = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Multi-OS Constellation</h1>
        <p className="font-mono text-xs text-muted-foreground mt-1">Specialized nodes, unified cockpit</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {nodes.map((node, i) => (
          <motion.div key={node.name} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.08 }}
            className={`p-5 rounded-lg border bg-card/50 ${node.status === "Online" ? "border-border/50" : "border-glow-amber/30"}`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Server className="h-5 w-5 text-foreground/70" />
                <div>
                  <h3 className="font-bold text-foreground">{node.name}</h3>
                  <p className="font-mono text-xs text-muted-foreground">{node.role}</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                {node.status === "Online" ? (
                  <>
                    <span className="status-dot" />
                    <span className="font-mono text-xs text-glow-green">{node.status}</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="h-3 w-3 text-glow-amber" />
                    <span className="font-mono text-xs text-glow-amber">{node.status}</span>
                  </>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono text-xs text-muted-foreground flex items-center gap-1"><Cpu className="h-3 w-3" /> CPU</span>
                  <span className="font-mono text-xs text-foreground">{node.cpu}%</span>
                </div>
                <div className="h-1 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-secondary rounded-full" style={{ width: `${node.cpu}%` }} />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono text-xs text-muted-foreground flex items-center gap-1"><MemoryStick className="h-3 w-3" /> MEM</span>
                  <span className="font-mono text-xs text-foreground">{node.mem}%</span>
                </div>
                <div className="h-1 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: `${node.mem}%` }} />
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-border/30 flex items-center justify-between font-mono text-xs text-muted-foreground">
              <span>{node.ip}</span>
              <span>Up: {node.uptime}</span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default Constellation;
