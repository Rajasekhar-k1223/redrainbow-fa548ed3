import { useState } from "react";
import { motion } from "framer-motion";
import { AlertOctagon, Bug, ShieldAlert, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { bus, type Severity } from "@/lib/eventBus";

const findings = [
  { id: "VLN-9821", title: "CVE-2024-4577 detected (PHP CGI argument injection)", asset: "edge-gateway-07", sev: "Critical", age: "2h", cvss: "9.8" },
  { id: "VLN-9820", title: "Open SSH port (22) exposed to 0.0.0.0/0", asset: "bastion-mgmt-02", sev: "High", age: "6h", cvss: "8.1" },
  { id: "VLN-9819", title: "Missing Security Headers (CSP, HSTS, X-Frame)", asset: "api.redrain.sec", sev: "Medium", age: "1d", cvss: "5.4" },
  { id: "VLN-9818", title: "S3 bucket logs-archive public ACL", asset: "aws-prod-account-1138", sev: "Critical", age: "1d", cvss: "9.1" },
  { id: "VLN-9817", title: "TLS 1.0 enabled on legacy listener", asset: "dev.redrain.sec", sev: "Medium", age: "2d", cvss: "5.9" },
  { id: "VLN-9816", title: "CVE-2024-3094 (xz-utils backdoor) in container image", asset: "k8s-sechub-cluster", sev: "Critical", age: "2d", cvss: "10.0" },
  { id: "VLN-9815", title: "Outdated jQuery 1.7.2 (XSS exposure)", asset: "vault.redrain.sec", sev: "Low", age: "3d", cvss: "3.1" },
  { id: "VLN-9814", title: "IAM role with wildcard permissions", asset: "gcp-analytics-pool", sev: "High", age: "5d", cvss: "7.8" },
];

const sevColors: Record<string, string> = {
  Critical: "text-primary border-primary/40 bg-primary/10",
  High: "text-glow-amber border-glow-amber/40 bg-glow-amber/10",
  Medium: "text-secondary border-secondary/40 bg-secondary/10",
  Low: "text-muted-foreground border-border bg-muted/30",
};

const filters = ["All", "Critical", "High", "Medium", "Low"] as const;

const Vulnerabilities = () => {
  const [filter, setFilter] = useState<(typeof filters)[number]>("All");
  const filtered = filter === "All" ? findings : findings.filter((f) => f.sev === filter);

  const counts = {
    Critical: findings.filter((f) => f.sev === "Critical").length,
    High: findings.filter((f) => f.sev === "High").length,
    Medium: findings.filter((f) => f.sev === "Medium").length,
    Low: findings.filter((f) => f.sev === "Low").length,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Vulnerabilities & Findings</h1>
        <p className="font-mono text-xs text-muted-foreground mt-1">Triage flaws across the entire attack surface</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Critical", value: counts.Critical, icon: AlertOctagon, color: "text-primary" },
          { label: "High", value: counts.High, icon: ShieldAlert, color: "text-glow-amber" },
          { label: "Medium", value: counts.Medium, icon: Bug, color: "text-secondary" },
          { label: "Low", value: counts.Low, icon: Bug, color: "text-muted-foreground" },
        ].map((s) => (
          <div key={s.label} className="p-4 rounded-lg border border-border/50 bg-card/50">
            <s.icon className={`h-4 w-4 ${s.color} mb-2`} />
            <p className="text-2xl font-bold text-foreground">{s.value}</p>
            <p className="font-mono text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded font-mono text-xs border transition-colors ${
              filter === f ? "border-primary/50 bg-primary/10 text-primary" : "border-border/50 text-muted-foreground hover:text-foreground"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="rounded-lg border border-border/50 bg-card/50 overflow-hidden">
        <div className="divide-y divide-border/30">
          {filtered.map((f, i) => (
            <motion.div key={f.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
              className="p-4 hover:bg-muted/20 transition-colors flex items-center gap-4">
              <span className={`px-2 py-0.5 rounded text-xs font-mono border ${sevColors[f.sev]} w-20 text-center`}>{f.sev}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground truncate">{f.title}</p>
                <div className="flex items-center gap-3 mt-1 font-mono text-xs text-muted-foreground">
                  <span>{f.id}</span>
                  <span>→ {f.asset}</span>
                  <span>CVSS {f.cvss}</span>
                  <span>{f.age} ago</span>
                </div>
              </div>
              <Button
                onClick={() => bus.emit("vulnerability.detected", {
                  id: f.id, cve: f.title.match(/CVE-\d{4}-\d+/)?.[0], title: f.title,
                  asset: f.asset, severity: f.sev as Severity, cvss: f.cvss,
                })}
                size="sm" variant="ghost" className="text-muted-foreground hover:text-foreground font-mono text-xs">
                Triage <ArrowUpRight className="h-3 w-3 ml-1" />
              </Button>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Vulnerabilities;
