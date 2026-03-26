import { motion } from "framer-motion";
import { Shield, Activity, Lock, Zap, ChevronRight, Radio, Terminal, Eye, Layers, Network, Server } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const stats = [
  { label: "Threat Intel", value: "2.4M", unit: "signals/day", icon: Radio },
  { label: "Ops Latency", value: "42ms", unit: "edge sync", icon: Zap },
  { label: "Vault Integrity", value: "99.999%", unit: "verified", icon: Lock },
];

const controlNodes = [
  { name: "Synaptic Hub", status: "Live", color: "status-live" },
  { name: "Telemetry", status: "Stable", color: "text-glow-cyan" },
  { name: "Vault", status: "Sealed", color: "text-glow-cyan" },
  { name: "Orchestration", status: "Ready", color: "status-live" },
  { name: "Network", status: "Isolated", color: "text-glow-cyan" },
];

const features = [
  { title: "Mission Orchestration", desc: "Design, launch, and monitor Red/Blue/Purple drills with synchronized state and audit trails.", icon: Layers, link: "/dashboard/missions" },
  { title: "Evidence Vault", desc: "Chain-of-custody storage for logs, screenshots, and binaries with immutable time seals.", icon: Lock, link: "/dashboard/vault" },
  { title: "Signal Mesh", desc: "Real-time telemetry fused from endpoints, services, and lab isolates.", icon: Activity, link: "/dashboard/signals" },
];

const osNodes = [
  { name: "Kali", role: "Red Team", color: "border-glow-red" },
  { name: "Security Onion", role: "Blue Team", color: "border-glow-cyan" },
  { name: "Qubes", role: "Isolation", color: "border-glow-cyan" },
  { name: "REMnux", role: "Malware", color: "border-glow-red" },
  { name: "SECHub", role: "Web App", color: "border-glow-cyan" },
  { name: "CAINE", role: "Forensics", color: "border-glow-cyan" },
];

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.6 } }),
};

const Index = () => {
  return (
    <div className="min-h-screen bg-background bg-grid bg-scanline relative overflow-hidden">
      {/* Scan line effect */}
      <div className="pointer-events-none fixed inset-0 z-50">
        <div className="absolute left-0 right-0 h-px bg-glow-cyan/20 animate-scan-line" />
      </div>

      {/* Nav */}
      <nav className="fixed top-0 w-full z-40 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <Shield className="h-6 w-6 text-primary" />
            <span className="font-mono font-bold text-lg tracking-wider text-foreground">
              RRC<span className="text-primary">Layer</span>
            </span>
          </div>
          <div className="hidden md:flex items-center gap-8 font-mono text-sm text-muted-foreground">
            <a href="#operations" className="hover:text-foreground transition-colors">Operations</a>
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#constellation" className="hover:text-foreground transition-colors">Constellation</a>
          </div>
          <Link to="/login">
            <Button variant="outline" className="font-mono text-sm border-primary/40 text-primary hover:bg-primary/10 hover:text-primary">
              Enter Ops
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
        <div className="container relative">
          <motion.div initial="hidden" animate="visible" className="max-w-4xl mx-auto text-center">
            <motion.p variants={fadeUp} custom={0} className="font-mono text-sm text-primary tracking-[0.3em] uppercase mb-4">
              Secure Orchestration Suite
            </motion.p>
            <motion.h1 variants={fadeUp} custom={1} className="text-5xl md:text-7xl font-black tracking-tight mb-2">
              <span className="text-foreground">RedRainbow</span>
              <span className="text-primary text-glow-red">Command</span>
              <span className="text-muted-foreground font-light"> Layer</span>
            </motion.h1>
            <motion.p variants={fadeUp} custom={2} className="text-lg text-muted-foreground max-w-2xl mx-auto mt-6 leading-relaxed">
              A cinematic security cockpit for multi-OS labs. Orchestrate missions, seal evidence, and stream telemetry with zero ambiguity.
            </motion.p>
            <motion.div variants={fadeUp} custom={3} className="flex items-center justify-center gap-4 mt-10">
              <Link to="/dashboard">
                <Button className="font-mono bg-primary hover:bg-primary/90 text-primary-foreground glow-red px-8 h-12">
                  Enter OperationsView <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <a href="#features">
                <Button variant="outline" className="font-mono border-border text-muted-foreground hover:text-foreground hover:border-foreground/30 h-12 px-8">
                  Signal Map
                </Button>
              </a>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 border-y border-border/50">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {stats.map((s, i) => (
              <motion.div key={s.label} variants={fadeUp} custom={i} initial="hidden" whileInView="visible" viewport={{ once: true }}
                className="text-center p-8 rounded-lg border border-border/50 bg-card/50 backdrop-blur">
                <s.icon className="h-5 w-5 text-secondary mx-auto mb-4" />
                <p className="font-mono text-xs text-muted-foreground uppercase tracking-widest mb-2">{s.label}</p>
                <p className="text-4xl font-black text-foreground">{s.value}</p>
                <p className="font-mono text-xs text-muted-foreground mt-1">{s.unit}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Control Node */}
      <section id="operations" className="py-20">
        <div className="container">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} className="max-w-3xl mx-auto">
            <motion.div variants={fadeUp} custom={0} className="text-center mb-12">
              <p className="font-mono text-xs text-secondary tracking-widest uppercase mb-2">Control Node</p>
              <h2 className="text-3xl font-bold text-foreground">Synaptic Hub</h2>
            </motion.div>
            <motion.div variants={fadeUp} custom={1} className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {controlNodes.map((node) => (
                <div key={node.name} className="p-4 rounded-lg border border-border/50 bg-card/30 text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <span className="status-dot" />
                    <span className={`font-mono text-xs font-semibold ${node.color}`}>{node.status}</span>
                  </div>
                  <p className="font-mono text-xs text-muted-foreground">{node.name}</p>
                </div>
              ))}
            </motion.div>
            <motion.div variants={fadeUp} custom={2} className="mt-6 text-center">
              <span className="font-mono text-sm text-glow-green">Pipeline Sync</span>
              <span className="font-mono text-sm text-glow-green ml-2">+2.4%</span>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 border-t border-border/50">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((f, i) => (
              <motion.div key={f.title} variants={fadeUp} custom={i} initial="hidden" whileInView="visible" viewport={{ once: true }}>
                <Link to={f.link} className="block p-8 rounded-lg border border-border/50 bg-card/30 hover:border-primary/30 transition-all duration-300 group h-full">
                  <f.icon className="h-8 w-8 text-primary mb-4 group-hover:text-glow-red transition-all" />
                  <h3 className="text-xl font-bold text-foreground mb-3">{f.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Multi-OS Constellation */}
      <section id="constellation" className="py-20 border-t border-border/50">
        <div className="container">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-12">
            <motion.p variants={fadeUp} custom={0} className="font-mono text-xs text-secondary tracking-widest uppercase mb-2">Multi-OS Constellation</motion.p>
            <motion.h2 variants={fadeUp} custom={1} className="text-3xl font-bold text-foreground mb-2">Specialized nodes, one cockpit.</motion.h2>
            <motion.p variants={fadeUp} custom={2} className="text-muted-foreground max-w-xl mx-auto">
              Execute precise test flows across curated OS roles while maintaining isolated, auditable state.
            </motion.p>
          </motion.div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 max-w-4xl mx-auto">
            {osNodes.map((node, i) => (
              <motion.div key={node.name} variants={fadeUp} custom={i} initial="hidden" whileInView="visible" viewport={{ once: true }}
                className={`p-5 rounded-lg border ${node.color} bg-card/30 text-center`}>
                <Server className="h-6 w-6 mx-auto mb-3 text-foreground/70" />
                <p className="font-mono text-sm font-bold text-foreground">{node.name}</p>
                <p className="font-mono text-xs text-muted-foreground mt-1">{node.role}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Terminal & Signal Cohesion */}
      <section className="py-20 border-t border-border/50">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <motion.div variants={fadeUp} custom={0} initial="hidden" whileInView="visible" viewport={{ once: true }}
              className="p-8 rounded-lg border border-border/50 bg-card/30">
              <Terminal className="h-8 w-8 text-primary mb-4" />
              <h3 className="text-xl font-bold text-foreground mb-3">Live Command Terminal</h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                Execute curated playbooks, capture logs, and publish findings directly to the vault.
              </p>
              <div className="bg-background/80 rounded border border-border/50 p-4 font-mono text-xs text-glow-green">
                <p className="text-muted-foreground">$ rrc --init --mode=redteam</p>
                <p className="mt-1">✓ Mission context loaded</p>
                <p>✓ Vault connection sealed</p>
                <p>✓ Telemetry stream active</p>
                <p className="mt-2 text-secondary">Ready for operations_</p>
              </div>
            </motion.div>
            <motion.div variants={fadeUp} custom={1} initial="hidden" whileInView="visible" viewport={{ once: true }}
              className="p-8 rounded-lg border border-border/50 bg-card/30">
              <Eye className="h-8 w-8 text-secondary mb-4" />
              <h3 className="text-xl font-bold text-foreground mb-3">Signal Cohesion</h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                Harmonize red and blue telemetry into a single, actionable narrative.
              </p>
              <div className="space-y-3">
                {["Red Team", "Blue Team", "Purple Ops"].map((team, i) => (
                  <div key={team} className="flex items-center gap-3">
                    <span className="status-dot" />
                    <span className="font-mono text-xs text-foreground">{team}</span>
                    <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: `${85 - i * 15}%` }} />
                    </div>
                    <span className="font-mono text-xs text-muted-foreground">{85 - i * 15}%</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="py-20 border-t border-border/50">
        <div className="container text-center">
          <p className="font-mono text-xs text-muted-foreground tracking-widest uppercase mb-4">Initialize</p>
          <h2 className="text-3xl font-bold text-foreground mb-6">Enter the Command Layer</h2>
          <Link to="/login">
            <Button className="font-mono bg-primary hover:bg-primary/90 text-primary-foreground glow-red px-10 h-12">
              Access Console <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      <footer className="py-8 border-t border-border/50">
        <div className="container text-center">
          <p className="font-mono text-xs text-muted-foreground">
            RedRainbowCommand Layer © 2026 — All systems nominal
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
