import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Server, WifiOff, Cpu, MemoryStick, Activity } from "lucide-react";

type Node = {
  name: string;
  role: string;
  status: "Online" | "Maintenance";
  cpu: number;
  mem: number;
  ip: string;
  uptime: string;
  x: number; // 0-100
  y: number; // 0-100
  color: string;
};

const initialNodes: Node[] = [
  { name: "Kali",           role: "Red Team",   status: "Online",      cpu: 42, mem: 67, ip: "10.0.1.10", uptime: "7d 12h", x: 22, y: 28, color: "var(--primary)" },
  { name: "Security Onion", role: "Blue Team",  status: "Online",      cpu: 28, mem: 54, ip: "10.0.2.10", uptime: "14d 3h", x: 78, y: 26, color: "var(--secondary)" },
  { name: "Qubes",          role: "Isolation",  status: "Online",      cpu: 15, mem: 32, ip: "10.0.3.10", uptime: "5d 8h",  x: 86, y: 64, color: "var(--glow-cyan)" },
  { name: "REMnux",         role: "Malware",    status: "Online",      cpu: 78, mem: 89, ip: "10.0.4.10", uptime: "2d 16h", x: 60, y: 82, color: "var(--glow-amber)" },
  { name: "SECHub",         role: "Web App",    status: "Maintenance", cpu: 0,  mem: 12, ip: "10.0.5.10", uptime: "0h",     x: 28, y: 78, color: "var(--glow-amber)" },
  { name: "CAINE",          role: "Forensics",  status: "Online",      cpu: 35, mem: 48, ip: "10.0.6.10", uptime: "9d 1h",  x: 14, y: 56, color: "var(--glow-green))" },
];

// Hub at center, nodes connect to hub plus a couple of peers
const links: Array<[number, number]> = [
  [0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 0], [0, 3], [1, 4],
];

const Constellation = () => {
  const [nodes, setNodes] = useState<Node[]>(initialNodes);
  const [tick, setTick] = useState(0);

  // Live mutate CPU/MEM so it feels alive
  useEffect(() => {
    const id = setInterval(() => {
      setNodes((prev) =>
        prev.map((n) =>
          n.status !== "Online"
            ? n
            : {
                ...n,
                cpu: Math.max(5, Math.min(95, n.cpu + Math.round((Math.random() - 0.5) * 8))),
                mem: Math.max(10, Math.min(95, n.mem + Math.round((Math.random() - 0.5) * 4))),
              },
        ),
      );
      setTick((t) => t + 1);
    }, 1800);
    return () => clearInterval(id);
  }, []);

  const hub = { x: 50, y: 50 };

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Multi-OS Constellation</h1>
          <p className="font-mono text-xs text-muted-foreground mt-1">Specialized nodes, unified cockpit — live mesh telemetry</p>
        </div>
        <div className="flex items-center gap-2 font-mono text-xs text-muted-foreground">
          <Activity className="h-3 w-3 text-glow-green" />
          <span>mesh sync · tick {tick}</span>
        </div>
      </div>

      {/* Cinematic constellation map */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="relative rounded-lg border border-border/50 bg-card/40 backdrop-blur-xl overflow-hidden"
        style={{ height: 420 }}
      >
        <div className="absolute inset-0 bg-grid opacity-40" />
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full">
          <defs>
            <radialGradient id="hubGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="hsl(var(--glow-cyan))" stopOpacity="0.5" />
              <stop offset="100%" stopColor="hsl(var(--glow-cyan))" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* hub aura */}
          <circle cx={hub.x} cy={hub.y} r="22" fill="url(#hubGlow)" />
          {[8, 14, 20, 28].map((r) => (
            <circle key={r} cx={hub.x} cy={hub.y} r={r} fill="none" stroke="hsl(var(--glow-cyan))" strokeOpacity="0.18" strokeWidth="0.15">
              <animate attributeName="r" from={r} to={r + 6} dur="3.5s" repeatCount="indefinite" />
              <animate attributeName="stroke-opacity" from="0.3" to="0" dur="3.5s" repeatCount="indefinite" />
            </circle>
          ))}

          {/* hub → node links with traveling pulse */}
          {nodes.map((n, i) => (
            <g key={`hub-${i}`}>
              <line
                x1={hub.x} y1={hub.y} x2={n.x} y2={n.y}
                stroke={`hsl(${n.status === "Online" ? "var(--glow-cyan)" : "var(--glow-amber)"})`}
                strokeOpacity="0.35" strokeWidth="0.18"
                strokeDasharray="0.8 0.8"
              />
              {n.status === "Online" && (
                <circle r="0.6" fill={`hsl(${n.color.replace(/\)$/, "")})`}>
                  <animateMotion dur={`${2.4 + i * 0.4}s`} repeatCount="indefinite" path={`M ${hub.x} ${hub.y} L ${n.x} ${n.y}`} />
                </circle>
              )}
            </g>
          ))}

          {/* peer links */}
          {links.map(([a, b], i) => (
            <line
              key={`peer-${i}`}
              x1={nodes[a].x} y1={nodes[a].y} x2={nodes[b].x} y2={nodes[b].y}
              stroke="hsl(var(--border))" strokeOpacity="0.5" strokeWidth="0.1"
            />
          ))}

          {/* hub core */}
          <circle cx={hub.x} cy={hub.y} r="1.6" fill="hsl(var(--glow-cyan))" />
          <circle cx={hub.x} cy={hub.y} r="0.8" fill="hsl(var(--background))" />

          {/* nodes */}
          {nodes.map((n) => {
            const c = `hsl(${n.color.replace(/\)$/, "")})`;
            return (
              <g key={n.name}>
                <circle cx={n.x} cy={n.y} r="2.4" fill={c} fillOpacity="0.18" />
                <circle cx={n.x} cy={n.y} r="1.2" fill={c}>
                  {n.status === "Online" && (
                    <animate attributeName="r" values="1.2;1.8;1.2" dur="2.2s" repeatCount="indefinite" />
                  )}
                </circle>
              </g>
            );
          })}
        </svg>

        {/* node labels overlaid in HTML for crisp text */}
        {nodes.map((n) => (
          <div
            key={n.name}
            className="absolute -translate-x-1/2 mt-3 text-center pointer-events-none"
            style={{ left: `${n.x}%`, top: `${n.y}%` }}
          >
            <div className="font-mono text-[10px] tracking-wider text-foreground/90 uppercase">{n.name}</div>
            <div className="font-mono text-[9px] text-muted-foreground">{n.role}</div>
          </div>
        ))}

        {/* hub label */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 mt-10 pointer-events-none text-center">
          <div className="font-mono text-[10px] tracking-[0.2em] text-glow-cyan uppercase">Synaptic Hub</div>
        </div>

        {/* corner legend */}
        <div className="absolute bottom-3 left-3 flex items-center gap-4 px-3 py-1.5 rounded border border-border/40 bg-background/60 backdrop-blur font-mono text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-glow-green" style={{ boxShadow: "0 0 6px hsl(var(--glow-green))" }} />ONLINE</span>
          <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-glow-amber" />MAINT</span>
          <span>· {nodes.filter((n) => n.status === "Online").length}/{nodes.length} live</span>
        </div>
      </motion.div>

      {/* Node detail cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {nodes.map((node, i) => (
          <motion.div
            key={node.name}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.06 }}
            className={`p-5 rounded-lg border bg-card/50 ${node.status === "Online" ? "border-border/50" : "border-glow-amber/30"}`}
          >
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
                  <div className="h-full bg-secondary rounded-full transition-all duration-700" style={{ width: `${node.cpu}%` }} />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono text-xs text-muted-foreground flex items-center gap-1"><MemoryStick className="h-3 w-3" /> MEM</span>
                  <span className="font-mono text-xs text-foreground">{node.mem}%</span>
                </div>
                <div className="h-1 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full transition-all duration-700" style={{ width: `${node.mem}%` }} />
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
