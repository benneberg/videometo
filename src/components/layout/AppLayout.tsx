import React from "react";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import {
  LayoutDashboard,
  Video,
  FileBadge,
  Settings,
  ShieldCheck,
  Loader2,
  Webhook
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { Link, useLocation } from "react-router-dom";
import { useIsFetching } from '@tanstack/react-query';
import { JobMonitor } from "@/components/JobMonitor";
export function AppSidebar(): JSX.Element {
  const location = useLocation();
  const navItems = [
    { title: "Dashboard", icon: LayoutDashboard, path: "/" },
    { title: "Asset Library", icon: Video, path: "/assets" },
    { title: "Profiles", icon: FileBadge, path: "/profiles" },
    { title: "Settings", icon: Settings, path: "/settings" },
  ];
  return (
    <Sidebar variant="sidebar" collapsible="icon">
      <SidebarHeader className="border-b py-4">
        <div className="flex items-center gap-3 px-2">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/20">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <span className="font-bold text-lg tracking-tight truncate">VideoMeta Pro</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            {navItems.map((item) => (
              <SidebarMenuItem key={item.path}>
                <SidebarMenuButton
                  asChild
                  isActive={location.pathname === item.path}
                  tooltip={item.title}
                >
                  <Link to={item.path}>
                    <item.icon className="h-4 w-4" />
                    <span className="font-medium">{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t p-4 space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-mono">
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            V5.1.0_STABLE
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-mono">
             <Webhook className="h-3 w-3" />
             HOOKS_UP
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
type AppLayoutProps = {
  children: React.ReactNode;
  className?: string;
};
export function AppLayout({ children, className }: AppLayoutProps): JSX.Element {
  const isFetching = useIsFetching();
  return (
    <SidebarProvider defaultOpen={true}>
      <AppSidebar />
      <SidebarInset className={className}>
        <header className="flex h-14 items-center gap-4 border-b bg-background/80 backdrop-blur-md px-6 sticky top-0 z-40">
          <SidebarTrigger />
          <div className="flex-1" />
          {isFetching > 0 && (
            <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-mono animate-in fade-in duration-300 bg-muted/50 px-2 py-1 rounded">
              <Loader2 className="h-3 w-3 animate-spin text-primary" />
              <span>SYNC_IN_PROGRESS</span>
            </div>
          )}
        </header>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10 lg:py-12 w-full min-h-[calc(100vh-3.5rem)] overflow-y-auto">
          {children}
        </main>
        <JobMonitor />
      </SidebarInset>
    </SidebarProvider>
  );
}