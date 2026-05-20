import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
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
  Search,
  Briefcase,
  Calendar,
  Bookmark,
  MessageSquare,
  Plus,
  Building2,
  LogOut,
  Moon,
  Sun,
  FileText,
  Blocks,
  Settings,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import logoLight from "@/assets/logo-light.png";
import logoDark from "@/assets/logo-dark.png";

interface RecruiterSidebarProps {
  hasJobs?: boolean;
  pendingVerificationCount?: number;
}

const mainNavItems = [
  { title: "Find Candidates", icon: Search, tab: "resdex" },
  { title: "Applications", icon: FileText, tab: "applications" },
  { title: "My Jobs", icon: Briefcase, tab: "jobs" },
  { title: "Interviews", icon: Calendar, tab: "interviews" },
];

const manageNavItems = [
  { title: "Events", icon: Calendar, tab: "events" },
  { title: "Saved", icon: Bookmark, tab: "saved" },
  { title: "Messages", icon: MessageSquare, tab: "messages" },
  { title: "OR Verification", icon: Blocks, tab: "blockchain" },
];

const RecruiterSidebar = ({ hasJobs = false, pendingVerificationCount = 0 }: RecruiterSidebarProps) => {
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { state, setOpenMobile } = useSidebar();
  const isCollapsed = state === "collapsed";

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
                  <item.icon className={cn("h-4 w-4 shrink-0", active && "text-primary")} />
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
      <SidebarHeader className="border-b border-sidebar-border/60 px-4 py-3.5">
        <button onClick={() => navigate("/recruiter-dashboard")} className="flex items-center">
          <img
            src={theme === "dark" ? logoDark : logoLight}
            alt="OWL Roles"
            width={321}
            height={193}
            className={cn("w-auto transition-all", isCollapsed ? "h-10" : "h-12")}
          />
        </button>
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
                  <Building2 className="h-4 w-4" />
                  {!isCollapsed && <span className="text-[13px]">My Profile</span>}
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
