import { motion } from "framer-motion";
import { Globe, Cloud, Server, Box, Search, Radar, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const assets = [
  { id: "AST-001", identifier: "api.redrain.sec", type: "Domain", env: "Prod", crit: "Critical", status: "Healthy", icon: Globe },
  { id: "AST-002", identifier: "aws-prod-account-1138", type: "Cloud", env: "Prod", crit: "Critical", status: "Drift", icon: Cloud },
  { id: "AST-003", identifier: "edge-gateway-07", type: "Server", env: "Prod", crit: "High", status: "Healthy", icon: Server },
  { id: "AST-004", identifier: "k8s-sechub-cluster", type: "Container", env: "Staging", crit: "Medium", status: "Healthy", icon: Box },
  { id: "AST-005", identifier: "vault.redrain.sec", type: "Domain", env: "Prod", crit: "Critical", status: "Healthy", icon: Globe },
  { id: "AST-006", identifier: "gcp-analytics-pool", type: "Cloud", env: "Prod", crit: "High", status: "Healthy", icon: Cloud },
  { id: "AST-007", identifier: "bastion-mgmt-02", type: "Server", env: "Prod", crit: "High", status: "Patch", icon: Server },
  { id: "AST-008", identifier: "remnux-sandbox-1", type: "Container", env: "Lab", crit: "Low", status: "Healthy", icon: Box },
  { id: "AST-009", identifier: "dev.redrain.sec", type: "Domain", env: "Staging", crit: "Medium", status: "Healthy", icon: Globe },
];

const critColors: Record<string, string> = {
  Critical: "text-primary border-primary/30 bg-primary/10",
  High: "text-glow-amber border-glow-amber/30 bg-glow-amber/10",
  Medium: "text-secondary border-secondary/30 bg-secondary/10",
  Low: "text-muted-foreground border-border bg-muted/30",
};

const statusColors: Record<string, string> = {
  Healthy: "text-glow-green",
  Drift: "text-glow-amber",
  Patch: "text-primary",
};

const Assets = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Asset Inventory</h1>
        <p className="font-mono text-xs text-muted-foreground mt-1">Continuous discovery across domains, cloud accounts, servers, and containers</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Filter assets..." className="pl-9 bg-card/50 border-border/50 font-mono text-sm" />
        </div>
        <Button size="sm" variant="outline" className="font-mono text-xs border-secondary/40 text-secondary hover:bg-secondary/10 hover:text-secondary">
          <Radar className="h-3 w-3 mr-2" /> Run Subdomain Enum
        </Button>
        <Button size="sm" variant="outline" className="font-mono text-xs border-glow-amber/40 text-glow-amber hover:bg-glow-amber/10">
          <Search className="h-3 w-3 mr-2" /> Run Open Port Scan
        </Button>
        <Button size="sm" variant="outline" className="font-mono text-xs border-primary/40 text-primary hover:bg-primary/10 hover:text-primary">
          <ShieldCheck className="h-3 w-3 mr-2" /> Run Cloud Posture Scan
        </Button>
      </div>

      <div className="rounded-lg border border-border/50 bg-card/50 overflow-hidden">
        <div className="grid grid-cols-12 gap-4 px-4 py-3 border-b border-border/50 font-mono text-xs text-muted-foreground uppercase tracking-wider">
          <div className="col-span-1">ID</div>
          <div className="col-span-4">Identifier</div>
          <div className="col-span-2">Type</div>
          <div className="col-span-2">Environment</div>
          <div className="col-span-2">Criticality</div>
          <div className="col-span-1">Status</div>
        </div>
        <div className="divide-y divide-border/30">
          {assets.map((a, i) => (
            <motion.div key={a.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
              className="grid grid-cols-12 gap-4 px-4 py-3 hover:bg-muted/20 transition-colors items-center">
              <span className="col-span-1 font-mono text-xs text-muted-foreground">{a.id}</span>
              <div className="col-span-4 flex items-center gap-2">
                <a.icon className="h-4 w-4 text-secondary flex-shrink-0" />
                <span className="font-mono text-sm text-foreground truncate">{a.identifier}</span>
              </div>
              <span className="col-span-2 font-mono text-xs text-muted-foreground">{a.type}</span>
              <span className="col-span-2 font-mono text-xs text-foreground">{a.env}</span>
              <div className="col-span-2">
                <span className={`px-2 py-0.5 rounded text-xs font-mono border ${critColors[a.crit]}`}>{a.crit}</span>
              </div>
              <div className="col-span-1 flex items-center gap-1.5">
                <span className="status-dot" />
                <span className={`font-mono text-xs ${statusColors[a.status]}`}>{a.status}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Assets;
