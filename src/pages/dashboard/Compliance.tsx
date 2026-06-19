import { motion } from "framer-motion";
import { Download, FileBadge, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const frameworks = [
  { name: "SOC 2 Type II", score: 94, color: "hsl(var(--glow-cyan))", controls: 132, passing: 124 },
  { name: "HIPAA", score: 88, color: "hsl(var(--glow-amber))", controls: 78, passing: 69 },
  { name: "ISO 27001", score: 96, color: "hsl(var(--glow-green))", controls: 114, passing: 109 },
];

const controls = [
  { ref: "CC6.1", framework: "SOC 2", desc: "Logical access controls", status: "Pass" },
  { ref: "CC7.2", framework: "SOC 2", desc: "Anomaly detection & monitoring", status: "Pass" },
  { ref: "164.312(a)", framework: "HIPAA", desc: "Unique user identification", status: "Pass" },
  { ref: "164.312(e)", framework: "HIPAA", desc: "Transmission security", status: "Review" },
  { ref: "A.8.16", framework: "ISO 27001", desc: "Monitoring activities", status: "Pass" },
  { ref: "A.5.7", framework: "ISO 27001", desc: "Threat intelligence", status: "Pass" },
];

const Ring = ({ value, color }: { value: number; color: string }) => {
  const R = 52;
  const C = 2 * Math.PI * R;
  const offset = C - (value / 100) * C;
  return (
    <svg width="140" height="140" viewBox="0 0 140 140" className="-rotate-90">
      <circle cx="70" cy="70" r={R} fill="none" stroke="hsl(var(--muted))" strokeWidth="8" />
      <circle cx="70" cy="70" r={R} fill="none" stroke={color} strokeWidth="8" strokeDasharray={C} strokeDashoffset={offset} strokeLinecap="round"
        style={{ filter: `drop-shadow(0 0 6px ${color})`, transition: "stroke-dashoffset 1s ease" }} />
    </svg>
  );
};

const Compliance = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Compliance & Reports</h1>
          <p className="font-mono text-xs text-muted-foreground mt-1">Continuous alignment across security frameworks</p>
        </div>
        <Button className="font-mono bg-primary hover:bg-primary/90 text-primary-foreground glow-red text-sm">
          <Download className="h-4 w-4 mr-2" /> Generate Executive Report
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {frameworks.map((f, i) => (
          <motion.div key={f.name} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
            className="p-6 rounded-lg border border-border/50 bg-card/50 flex items-center gap-4">
            <div className="relative">
              <Ring value={f.score} color={f.color} />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-bold text-foreground">{f.score}%</span>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-foreground">{f.name}</h3>
              <p className="font-mono text-xs text-muted-foreground mt-1">{f.passing}/{f.controls} controls</p>
              <p className="font-mono text-xs text-glow-green mt-2 flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" /> Audit ready
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 p-6 rounded-lg border border-border/50 bg-card/50">
          <h2 className="text-lg font-bold text-foreground mb-4">Control Coverage</h2>
          <div className="space-y-3">
            {controls.map((c) => (
              <div key={c.ref} className="flex items-center gap-3 py-2 border-b border-border/30 last:border-0">
                {c.status === "Pass" ? (
                  <CheckCircle2 className="h-4 w-4 text-glow-green flex-shrink-0" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-glow-amber flex-shrink-0" />
                )}
                <span className="font-mono text-xs text-secondary w-24">{c.ref}</span>
                <span className="font-mono text-xs text-muted-foreground w-20">{c.framework}</span>
                <span className="text-sm text-foreground flex-1 truncate">{c.desc}</span>
                <span className={`font-mono text-xs ${c.status === "Pass" ? "text-glow-green" : "text-glow-amber"}`}>{c.status}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="p-6 rounded-lg border border-border/50 bg-card/50">
          <FileBadge className="h-6 w-6 text-primary mb-3" />
          <h3 className="font-bold text-foreground">Recent Reports</h3>
          <div className="mt-4 space-y-3">
            {[
              { name: "Q2-2026-Executive.pdf", date: "Jun 18" },
              { name: "SOC2-Evidence-Pack.pdf", date: "Jun 12" },
              { name: "HIPAA-Audit-Trail.pdf", date: "Jun 04" },
              { name: "ISO27001-Annex-A.pdf", date: "May 28" },
            ].map((r) => (
              <div key={r.name} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
                <span className="font-mono text-xs text-foreground truncate">{r.name}</span>
                <span className="font-mono text-xs text-muted-foreground">{r.date}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Compliance;
