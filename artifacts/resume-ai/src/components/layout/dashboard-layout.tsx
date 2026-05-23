import { useState } from "react";
import { Link, useLocation } from "wouter";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
  SidebarHeader,
  SidebarFooter,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Briefcase, LayoutDashboard, FileText, LogOut, Crosshair, Clock, Zap, CreditCard, Settings as SettingsIcon, Menu } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@workspace/replit-auth-web";
import UpgradeModal from "@/components/upgrade-modal";

const navItems = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { title: "Analyze", href: "/analyze", icon: Crosshair },
  { title: "My Resumes", href: "/resumes", icon: FileText },
  { title: "History", href: "/history", icon: Clock },
  { title: "Settings", href: "/settings", icon: SettingsIcon },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  const displayName = user
    ? [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email || "User"
    : "User";

  const initials = displayName
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const isPro = (user as { plan?: string } | null)?.plan === "pro";

  function handleManageBilling() {
    // Redirect to settings for billing management since Paystack doesn't have a portal
    window.location.href = "/settings";
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-[100dvh] w-full bg-background">
        <Sidebar className="border-r border-border">
          <SidebarHeader className="h-16 flex items-center px-4 border-b border-border/50">
            <Link href="/dashboard" className="flex items-center gap-2 text-primary font-bold text-xl tracking-tight">
              <Briefcase className="h-5 w-5" />
              MatchFolio
            </Link>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  {navItems.map((item) => {
                    const isActive = location === item.href || location.startsWith(`${item.href}/`);
                    return (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton asChild isActive={isActive} tooltip={item.title}>
                          <Link href={item.href} className="flex items-center gap-3">
                            <item.icon className="h-4 w-4" />
                            <span>{item.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter className="border-t border-border/50 p-4">
            <div className="flex items-center gap-3 mb-3">
              <Avatar className="h-9 w-9 border border-border">
                {user?.profileImageUrl && (
                  <AvatarImage src={user.profileImageUrl} alt={displayName} />
                )}
                <AvatarFallback className="bg-secondary text-secondary-foreground text-xs">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-medium truncate">{displayName}</span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  {isPro ? (
                    <Badge className="bg-primary/15 text-primary border-primary/30 text-[10px] px-1.5 py-0 h-4">
                      <Zap className="h-2.5 w-2.5 mr-0.5" />
                      Pro
                    </Badge>
                  ) : (
                    <span className="text-xs text-muted-foreground">Free plan</span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              {isPro ? (
                <SidebarMenuButton
                  variant="default"
                  className="text-muted-foreground hover:text-foreground"
                  onClick={handleManageBilling}
                >
                  <CreditCard className="h-4 w-4" />
                  <span>Manage billing</span>
                </SidebarMenuButton>
              ) : (
                <SidebarMenuButton
                  variant="default"
                  className="text-primary hover:text-primary/90 hover:bg-primary/10"
                  onClick={() => setUpgradeOpen(true)}
                >
                  <Zap className="h-4 w-4" />
                  <span>Upgrade to Pro</span>
                </SidebarMenuButton>
              )}
              <SidebarMenuButton
                variant="default"
                className="text-muted-foreground hover:text-foreground"
                onClick={logout}
              >
                <LogOut className="h-4 w-4" />
                <span>Log out</span>
              </SidebarMenuButton>
            </div>
          </SidebarFooter>
        </Sidebar>
        <main className="flex-1 flex flex-col h-[100dvh] overflow-y-auto relative">
          <div className="lg:hidden absolute top-4 left-4 z-50">
            <SidebarTrigger>
              <Button variant="outline" size="icon" className="h-8 w-8 bg-background/80 backdrop-blur-sm border-border/50">
                <Menu className="h-4 w-4" />
              </Button>
            </SidebarTrigger>
          </div>
          <div className="flex-1 lg:pt-0 pt-16">
            {children}
          </div>
        </main>
      </div>

      <UpgradeModal open={upgradeOpen} onClose={() => setUpgradeOpen(false)} />
    </SidebarProvider>
  );
}
