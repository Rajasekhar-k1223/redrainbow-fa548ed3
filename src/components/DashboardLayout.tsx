import { Outlet } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { NotificationCenter } from "@/components/NotificationCenter";
import { PreferencesProvider } from "@/components/PreferencesProvider";
import { ShortcutsDialog } from "@/components/ShortcutsDialog";



const statusNodes = [
  { name: "Synaptic Hub", color: "hsl(var(--glow-green))" },
  { name: "Live Telemetry", color: "hsl(var(--glow-green))" },
  { name: "Stable Vault", color: "hsl(var(--glow-cyan))" },
  { name: "Network Isolated", color: "hsl(var(--glow-green))" },
];

const DashboardLayout = () => {
  return (
    <SidebarProvider>
    <SidebarProvider>
      <PreferencesProvider />
      <ShortcutsDialog />
      <div className="min-h-screen flex w-full bg-background bg-grid data-[density=compact]:text-[13px]" data-density-scope>
        <DashboardSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center border-b border-border/50 bg-background/70 backdrop-blur-xl px-4 gap-4">
            <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
            <div className="hidden md:flex items-center gap-4 ml-2">
              {statusNodes.map((n) => (
                <div key={n.name} className="flex items-center gap-2 px-2.5 py-1 rounded border border-border/40 bg-card/40">
                  <span
                    className="w-1.5 h-1.5 rounded-full animate-pulse"
                    style={{ background: n.color, boxShadow: `0 0 8px ${n.color}` }}
                  />
                  <span className="font-mono text-[10px] tracking-wider text-muted-foreground uppercase">{n.name}</span>
                </div>
              ))}
            </div>
            <div className="ml-auto flex items-center gap-3">
              <button
                onClick={() => window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true }))}
                className="hidden md:flex items-center gap-2 px-2.5 py-1 rounded border border-border/40 bg-card/40 hover:bg-card/80 transition-colors"
                aria-label="Open command palette"
              >
                <span className="font-mono text-[10px] tracking-wider text-muted-foreground uppercase">Command</span>
                <kbd className="font-mono text-[10px] px-1 py-0.5 rounded bg-muted/60 text-muted-foreground border border-border/50">⌘K</kbd>
              </button>
              <NotificationCenter />
              <span className="font-mono text-[10px] tracking-wider text-muted-foreground hidden sm:inline">
                {new Date().toUTCString().slice(17, 25)} UTC
              </span>
              <span className="status-dot" />
              <span className="font-mono text-xs text-glow-green">SECURE</span>
            </div>
          </header>
          <main className="flex-1 p-6 overflow-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default DashboardLayout;
