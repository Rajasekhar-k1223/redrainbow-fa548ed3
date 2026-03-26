import { Shield, Activity, Lock, Layers, Terminal, Network, Radio, Settings, LogOut } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation, Link } from "react-router-dom";
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

const mainItems = [
  { title: "Overview", url: "/dashboard", icon: Activity },
  { title: "Missions", url: "/dashboard/missions", icon: Layers },
  { title: "Signal Mesh", url: "/dashboard/signals", icon: Radio },
  { title: "Evidence Vault", url: "/dashboard/vault", icon: Lock },
  { title: "Constellation", url: "/dashboard/constellation", icon: Network },
  { title: "Terminal", url: "/dashboard/terminal", icon: Terminal },
];

export function DashboardSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;

  return (
    <Sidebar collapsible="icon" className="border-r border-border/50 bg-sidebar">
      <div className="p-4 border-b border-border/50">
        <Link to="/" className="flex items-center gap-2">
          <Shield className="h-6 w-6 text-primary flex-shrink-0" />
          {!collapsed && (
            <span className="font-mono font-bold text-sm tracking-wider text-foreground">
              RRC<span className="text-primary">Layer</span>
            </span>
          )}
        </Link>
      </div>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="font-mono text-xs text-muted-foreground tracking-widest">
            {!collapsed && "OPERATIONS"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === "/dashboard"}
                      className="hover:bg-muted/50 font-mono text-sm"
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
      </SidebarContent>

      <SidebarFooter className="border-t border-border/50 p-3">
        <div className="flex items-center gap-2">
          <span className="status-dot" />
          {!collapsed && <span className="font-mono text-xs text-muted-foreground">Systems nominal</span>}
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
