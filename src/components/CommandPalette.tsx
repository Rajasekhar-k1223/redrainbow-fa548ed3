// Global ⌘K / Ctrl+K command palette. Cross-page navigation + quick actions.
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Activity, Boxes, Bug, FileBadge, Radio, AlertOctagon, Fingerprint,
  Lock, Layers, Network, Terminal, FileText, Plug, Settings as SettingsIcon, Sparkles, Shield, Zap,
} from "lucide-react";
import { publishToVault } from "@/lib/vaultStore";
import { createIncident } from "@/lib/incidentStore";
import { bus } from "@/lib/eventBus";

const routes: Array<{ label: string; path: string; icon: React.ComponentType<{ className?: string }>; group: string }> = [
  { label: "Executive Cockpit",    path: "/dashboard",                 icon: Activity,       group: "Navigate" },
  { label: "Asset Inventory",      path: "/dashboard/assets",          icon: Boxes,          group: "Navigate" },
  { label: "Vulnerabilities",      path: "/dashboard/vulnerabilities", icon: Bug,            group: "Navigate" },
  { label: "Compliance",           path: "/dashboard/compliance",      icon: FileBadge,      group: "Navigate" },
  { label: "Telemetry",            path: "/dashboard/telemetry",       icon: Radio,          group: "Navigate" },
  { label: "Signal Mesh",          path: "/dashboard/signals",         icon: Activity,       group: "Navigate" },
  { label: "Incidents",            path: "/dashboard/incidents",       icon: AlertOctagon,   group: "Navigate" },
  { label: "IOC Ledger",           path: "/dashboard/iocs",            icon: Fingerprint,    group: "Navigate" },
  { label: "Evidence Vault",       path: "/dashboard/vault",           icon: Lock,           group: "Navigate" },
  { label: "Missions",             path: "/dashboard/missions",        icon: Layers,         group: "Navigate" },
  { label: "Constellation",        path: "/dashboard/constellation",   icon: Network,        group: "Navigate" },
  { label: "Copilot",              path: "/dashboard/copilot",         icon: Sparkles,       group: "Navigate" },
  { label: "Live Terminal",        path: "/dashboard/terminal",        icon: Terminal,       group: "Navigate" },
  { label: "Reporting Center",     path: "/dashboard/reports",         icon: FileText,       group: "Navigate" },
  { label: "Integrations",         path: "/dashboard/integrations",    icon: Plug,           group: "Navigate" },
  { label: "Settings & RBAC",      path: "/dashboard/settings",        icon: SettingsIcon,   group: "Navigate" },
];

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const nav = useNavigate();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const go = (path: string) => { setOpen(false); nav(path); };

  const quickIncident = () => {
    const inc = createIncident({
      title: "Manual incident opened from palette",
      severity: "High", status: "Open", owner: "ghost.7",
      source: "Command Palette",
    });
    setOpen(false);
    toast.success(`Opened ${inc.id}`);
    nav("/dashboard/incidents");
  };

  const quickSeal = () => {
    publishToVault({
      name: `snapshot-${Date.now()}.evd`, type: "Snapshot", size: "24 KB",
      source: "Command Palette",
    });
    setOpen(false);
    toast.success("Sealed snapshot to Evidence Vault");
  };

  const raisePosture = () => {
    bus.emit("notification.created", { level: "warn", title: "Cockpit posture raised", detail: "Non-essential integrations paused" });
    setOpen(false);
    toast.warning("Posture raised — non-essential integrations paused");
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or search…" />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        <CommandGroup heading="Quick Actions">
          <CommandItem onSelect={quickIncident}>
            <AlertOctagon className="mr-2 h-4 w-4 text-primary" />
            Open new incident
          </CommandItem>
          <CommandItem onSelect={quickSeal}>
            <Lock className="mr-2 h-4 w-4 text-glow-cyan" />
            Seal snapshot to Vault
          </CommandItem>
          <CommandItem onSelect={raisePosture}>
            <Shield className="mr-2 h-4 w-4 text-glow-amber" />
            Raise cockpit posture
          </CommandItem>
          <CommandItem onSelect={() => go("/dashboard/copilot")}>
            <Zap className="mr-2 h-4 w-4 text-secondary" />
            Ask the Copilot
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Navigate">
          {routes.map((r) => (
            <CommandItem key={r.path} onSelect={() => go(r.path)}>
              <r.icon className="mr-2 h-4 w-4 text-muted-foreground" />
              {r.label}
              <span className="ml-auto font-mono text-[10px] text-muted-foreground">{r.path}</span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
