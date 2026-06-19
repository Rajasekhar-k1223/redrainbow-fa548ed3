import { Shield, Activity, Lock, Layers, Terminal, Network, Radio, LogOut, Boxes, Bug, FileBadge } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { Link } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";

const sections = [
  {
    label: "EXPOSURE MANAGEMENT",
    items: [
      { title: "Executive Cockpit", url: "/dashboard", icon: Activity, end: true },
      { title: "Asset Inventory", url: "/dashboard/assets", icon: Boxes },
      { title: "Vulnerabilities", url: "/dashboard/vulnerabilities", icon: Bug },
      { title: "Compliance & Reports", url: "/dashboard/compliance", icon: FileBadge },
    ],
  },
  {
    label: "ACTIVE THREATS",
    items: [
      { title: "Monitorix Telemetry", url: "/dashboard/telemetry", icon: Radio },
      { title: "Signal Mesh", url: "/dashboard/signals", icon: Activity },
      { title: "Evidence Vault", url: "/dashboard/vault", icon: Lock },
    ],
  },
  {
    label: "COMMAND LAYER",
    items: [
      { title: "Mission Orchestration", url: "/dashboard/missions", icon: Layers },
      { title: "Multi-OS Constellation", url: "/dashboard/constellation", icon: Network },
      { title: "Live Terminal", url: "/dashboard/terminal", icon: Terminal },
    ],
  },
];

export function DashboardSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  return (
    <Sidebar collapsible="icon" className="border-r border-border/50 bg-sidebar">
      <div className="p-4 border-b border-border/50">
        <Link to="/" className="flex items-center gap-2">
          <Shield className="h-6 w-6 text-primary flex-shrink-0" />
          {!collapsed && (
            <span className="font-mono font-bold text-sm tracking-wider text-foreground">
              Red<span className="text-primary">Rainbow</span>
            </span>
          )}
        </Link>
      </div>

      <SidebarContent>
        {sections.map((section) => (
          <SidebarGroup key={section.label}>
            <SidebarGroupLabel className="font-mono text-[10px] text-muted-foreground tracking-[0.2em]">
              {!collapsed && section.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {section.items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.url}
                        end={item.end}
                        className="hover:bg-muted/40 font-mono text-sm"
                        activeClassName="bg-primary/10 text-primary border-l-2 border-primary"
                      >
                        <item.icon className="mr-2 h-4 w-4 flex-shrink-0" />
                        {!collapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="border-t border-border/50 p-3">
        <div className="flex items-center gap-2">
          <span className="status-dot" />
          {!collapsed && <span className="font-mono text-xs text-muted-foreground">Operator: ghost.7</span>}
        </div>
        {!collapsed && (
          <Link to="/login" className="flex items-center gap-2 mt-3 font-mono text-xs text-muted-foreground hover:text-foreground transition-colors">
            <LogOut className="h-3 w-3" />
            <span>Disconnect</span>
          </Link>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
