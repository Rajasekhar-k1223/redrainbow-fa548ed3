import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, FileText, Image, HardDrive, Clock, Shield } from "lucide-react";
import { subscribeVault, type VaultItem } from "@/lib/vaultStore";

const baseItems = [
  { id: "EV-2847", name: "packet_capture_0412.pcap", type: "Binary",     size: "24.7 MB", sealed: "2m ago",  hash: "a3f7...c9d2", custody: "Sealed",      icon: HardDrive },
  { id: "EV-2846", name: "lateral_movement_log.json", type: "Log",        size: "1.2 MB",  sealed: "45m ago", hash: "b8e1...4f7a", custody: "Sealed",      icon: FileText },
  { id: "EV-2845", name: "c2_screenshot_proof.png",   type: "Screenshot", size: "3.4 MB",  sealed: "1h ago",  hash: "d2c9...8b3e", custody: "In Review",   icon: Image },
  { id: "EV-2844", name: "memory_dump_qubes01.raw",   type: "Binary",     size: "512 MB",  sealed: "2h ago",  hash: "f1a3...7d6c", custody: "Sealed",      icon: HardDrive },
  { id: "EV-2843", name: "incident_timeline.md",      type: "Document",   size: "28 KB",   sealed: "4h ago",  hash: "c7b2...1e9f", custody: "Transferred", icon: FileText },
  { id: "EV-2842", name: "malware_sample_x47.bin",    type: "Binary",     size: "847 KB",  sealed: "6h ago",  hash: "e4d8...3a5b", custody: "Sealed",      icon: HardDrive },
];

const custodyStyle: Record<string, string> = {
  Sealed: "text-glow-green border-glow-green/30 bg-glow-green/10",
  "In Review": "text-glow-amber border-glow-amber/30 bg-glow-amber/10",
  Transferred: "text-secondary border-secondary/30 bg-secondary/10",
};

const iconFor = (type: string) => (type === "Log" || type === "Document" ? FileText : type === "Screenshot" ? Image : HardDrive);

const Vault = () => {
  const [live, setLive] = useState<VaultItem[]>([]);
  useEffect(() => { const unsub = subscribeVault(setLive); return () => { unsub(); }; }, []);
  const vaultItems = [
    ...live.map((i) => ({ ...i, icon: iconFor(i.type) })),
    ...baseItems,
  ];
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Evidence Vault</h1>
          <p className="font-mono text-xs text-muted-foreground mt-1">Chain-of-custody storage with immutable time seals</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded border border-glow-green/30 bg-glow-green/5">
          <Shield className="h-4 w-4 text-glow-green" />
          <span className="font-mono text-xs text-glow-green">Integrity: 99.999%</span>
        </div>
      </div>

      <div className="rounded-lg border border-border/50 bg-card/50 overflow-hidden">
        <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-3 border-b border-border/50 font-mono text-xs text-muted-foreground uppercase tracking-wider">
          <div className="col-span-4">Filename</div>
          <div className="col-span-2">Type / Size</div>
          <div className="col-span-3">Hash (SHA-256)</div>
          <div className="col-span-1">Sealed</div>
          <div className="col-span-2 text-right">Custody Status</div>
        </div>
        <div className="divide-y divide-border/30">
          {vaultItems.map((item, i) => (
            <motion.div key={item.id} initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
              className="grid grid-cols-1 md:grid-cols-12 gap-4 px-4 py-3 hover:bg-muted/20 transition-colors items-center">
              <div className="md:col-span-4 flex items-center gap-3 min-w-0">
                <item.icon className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{item.name}</p>
                  <p className="font-mono text-xs text-muted-foreground">{item.id}</p>
                </div>
              </div>
              <div className="md:col-span-2 font-mono text-xs text-muted-foreground">
                <span className="text-foreground">{item.type}</span> · {item.size}
              </div>
              <div className="md:col-span-3 flex items-center gap-2">
                <Lock className="h-3 w-3 text-glow-green flex-shrink-0" />
                <span className="font-mono text-xs text-secondary truncate">{item.hash}</span>
              </div>
              <div className="md:col-span-1 font-mono text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" /> {item.sealed}
              </div>
              <div className="md:col-span-2 md:text-right">
                <span className={`inline-block px-2 py-0.5 rounded text-xs font-mono border ${custodyStyle[item.custody]}`}>
                  {item.custody}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Vault;
