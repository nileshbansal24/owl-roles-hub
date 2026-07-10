import { useEffect, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Plus,
  LogOut,
  Moon,
  Sun,
  Users,
  Briefcase,
  BarChart3,
  CalendarDays,
  Bookmark,
  MessageSquare,
  ShieldCheck,
  Building2,
  Crown,
  type LucideIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import logoLight from "@/assets/logo-light.png";
import logoDark from "@/assets/logo-dark.png";

interface RecruiterSidebarProps {
  hasJobs?: boolean;
  pendingVerificationCount?: number;
}

const NavIcon = ({ Icon, active }: { Icon: LucideIcon; active?: boolean }) => (
  <span
    className={cn(
      "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-all",
      active
        ? "bg-primary/15 text-primary ring-1 ring-primary/25 dark:bg-primary/20 dark:ring-primary/40"
        : "bg-transparent text-sidebar-foreground/60 group-hover:text-sidebar-foreground"
    )}
  >
    <Icon className="h-[18px] w-[18px]" strokeWidth={active ? 2.25 : 2} />
  </span>
);

const mainNavItems = [
  { title: "Find Candidates", icon: Users, tab: "resdex" },
  { title: "Manage Jobs", icon: Briefcase, tab: "manage" },
  { title: "Analytics", icon: BarChart3, tab: "analytics" },
];

const manageNavItems = [
  { title: "Events", icon: CalendarDays, tab: "events" },
  { title: "Saved", icon: Bookmark, tab: "saved" },
  { title: "Messages", icon: MessageSquare, tab: "messages" },
  { title: "OR Verification", icon: ShieldCheck, tab: "blockchain" },
];

const RecruiterSidebar = ({ hasJobs = false, pendingVerificationCount = 0 }: RecruiterSidebarProps) => {
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { state, setOpenMobile } = useSidebar();
  const isCollapsed = state === "collapsed";
  const [plan, setPlan] = useState<string>("free");

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("subscription_plan")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => setPlan((data?.subscription_plan as string) || "free"));
  }, [user]);

  const currentTab = searchParams.get("tab") || "resdex";

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const getInitials = (email: string) => email.slice(0, 2).toUpperCase();

  const handleNavClick = (tab: string) => {
    setOpenMobile(false);
    navigate(tab === "resdex" ? "/recruiter-dashboard" : `/recruiter-dashboard?tab=${tab}`);
  };

  const isActive = (tab: string) => {
    if (location.pathname !== "/recruiter-dashboard") return false;
    if (tab === "manage") {
      return ["manage", "jobs", "applications", "interviews"].includes(currentTab);
    }
    return currentTab === tab;
  };

  const renderNavGroup = (items: typeof mainNavItems, label: string) => (
    <SidebarGroup>
      {!isCollapsed && (
        <SidebarGroupLabel className="text-[10px] font-semibold text-sidebar-foreground/40 uppercase tracking-[0.08em] px-3 mb-0.5">
          {label}
        </SidebarGroupLabel>
      )}
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => {
            const active = isActive(item.tab);
            return (
              <SidebarMenuItem key={item.tab}>
                <SidebarMenuButton
                  onClick={() => handleNavClick(item.tab)}
                  isActive={active}
                  tooltip={item.title}
                  className={cn(
                    "relative h-9 rounded-lg transition-all duration-150",
                    active
                      ? "bg-primary/10 text-primary font-medium dark:bg-primary/15"
                      : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/60"
                  )}
                >
                  {active && (
                    <motion.div
                      layoutId="sidebar-active"
                      className="absolute left-0 top-1.5 bottom-1.5 w-[2px] rounded-full bg-primary"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                  <NavIcon Icon={item.icon} active={active} />
                  {!isCollapsed && <span className="text-[13px] flex-1">{item.title}</span>}
                  {!isCollapsed && item.tab === "blockchain" && pendingVerificationCount > 0 && (
                    <span className="ml-auto inline-flex items-center justify-center h-5 min-w-5 px-1.5 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold">
                      {pendingVerificationCount}
                    </span>
                  )}
                  {isCollapsed && item.tab === "blockchain" && pendingVerificationCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 h-4 min-w-4 px-1 rounded-full bg-destructive text-destructive-foreground text-[9px] font-bold flex items-center justify-center">
                      {pendingVerificationCount}
                    </span>
                  )}
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border/60">
      {/* Header */}
      <SidebarHeader className={cn("border-b border-sidebar-border/60 py-3.5", isCollapsed ? "px-2 flex items-center justify-center" : "px-4")}>
        {!isCollapsed && (
          <button onClick={() => navigate("/recruiter-dashboard")} className="flex items-center">
            <img
              src={theme === "dark" ? logoDark : logoLight}
              alt="OWL Roles"
              width={321}
              height={193}
              className="w-auto h-12 transition-all"
            />
          </button>
        )}
      </SidebarHeader>

      <SidebarContent className="px-2 py-3">
        {/* Post Job CTA */}
        <div className="px-2 mb-4">
          <Button
            onClick={() => { setOpenMobile(false); navigate("/post-job"); }}
            className={cn(
              "w-full justify-start gap-2 h-9 rounded-lg text-[13px] font-medium shadow-none",
              isCollapsed && "justify-center px-0"
            )}
            size={isCollapsed ? "icon" : "default"}
          >
            <Plus className="h-4 w-4" />
            {!isCollapsed && <span>Post a Job</span>}
          </Button>
        </div>

        {renderNavGroup(mainNavItems, "Core")}
        {renderNavGroup(manageNavItems, "Manage")}

        {/* Settings at bottom */}
        <SidebarGroup className="mt-auto">
          {!isCollapsed && (
            <SidebarGroupLabel className="text-[10px] font-semibold text-sidebar-foreground/40 uppercase tracking-[0.08em] px-3 mb-0.5">
              Settings
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => { setOpenMobile(false); navigate("/recruiter-profile"); }}
                  tooltip="My Profile"
                  isActive={location.pathname === "/recruiter-profile"}
                  className={cn(
                    "h-9 rounded-lg transition-all duration-150",
                    location.pathname === "/recruiter-profile"
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-sidebar-foreground/70 hover:text-sidebar-foreground"
                  )}
                >
                  <NavIcon Icon={Building2} active={location.pathname === "/recruiter-profile"} />
                  {!isCollapsed && <span className="text-[13px]">My Profile</span>}
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => { setOpenMobile(false); navigate("/recruiter-upgrade"); }}
                  tooltip="Upgrade Plan"
                  isActive={location.pathname === "/recruiter-upgrade"}
                  className={cn(
                    "h-9 rounded-lg transition-all duration-150",
                    location.pathname === "/recruiter-upgrade"
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-amber-600 dark:text-amber-400 hover:bg-amber-500/10"
                  )}
                >
                  <NavIcon Icon={Crown} active={location.pathname === "/recruiter-upgrade"} />
                  {!isCollapsed && (
                    <>
                      <span className="text-[13px] flex-1">Upgrade Plan</span>
                      <Badge variant="outline" className="text-[9px] h-4 px-1.5 capitalize">
                        {plan}
                      </Badge>
                    </>
                  )}
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={toggleTheme}
                  tooltip={theme === "light" ? "Dark Mode" : "Light Mode"}
                  className="h-9 rounded-lg text-sidebar-foreground/70 hover:text-sidebar-foreground transition-all duration-150"
                >
                  {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                  {!isCollapsed && (
                    <span className="text-[13px]">{theme === "light" ? "Dark Mode" : "Light Mode"}</span>
                  )}
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer */}
      <SidebarFooter className="border-t border-sidebar-border/60 p-3">
        <div className={cn(
          "flex items-center gap-2.5 rounded-lg p-2 hover:bg-sidebar-accent/50 transition-colors cursor-default",
          isCollapsed && "justify-center p-1.5"
        )}>
          <Avatar className="h-8 w-8 shrink-0">
            <AvatarImage src="" alt={user?.email || ""} />
            <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
              {getInitials(user?.email || "U")}
            </AvatarFallback>
          </Avatar>
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-medium text-sidebar-foreground truncate">
                {user?.email}
              </p>
              <p className="text-[10px] text-sidebar-foreground/40 font-medium">Recruiter</p>
            </div>
          )}
          {!isCollapsed && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSignOut}
              className="shrink-0 h-7 w-7 text-sidebar-foreground/30 hover:text-destructive hover:bg-destructive/10 rounded-md"
            >
              <LogOut className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
};

export default RecruiterSidebar;
