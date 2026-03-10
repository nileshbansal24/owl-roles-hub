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
  ChevronRight,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import logoLight from "@/assets/logo-light.png";
import logoDark from "@/assets/logo-dark.png";

interface RecruiterSidebarProps {
  hasJobs?: boolean;
}

const navItems = [
  { title: "Find Candidates", icon: Search, tab: "resdex" },
  { title: "Applications", icon: FileText, tab: "applications" },
  { title: "My Jobs", icon: Briefcase, tab: "jobs" },
  { title: "Events", icon: Calendar, tab: "events" },
  { title: "Interviews", icon: Calendar, tab: "interviews" },
  { title: "Saved", icon: Bookmark, tab: "saved" },
  { title: "Messages", icon: MessageSquare, tab: "messages" },
  { title: "OR Verification", icon: Blocks, tab: "blockchain" },
];

const RecruiterSidebar = ({ hasJobs = false }: RecruiterSidebarProps) => {
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

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      {/* Header */}
      <SidebarHeader className="border-b border-sidebar-border px-4 py-4">
        <button onClick={() => navigate("/recruiter-dashboard")} className="flex items-center">
          <img
            src={theme === "dark" ? logoDark : logoLight}
            alt="OWL Roles"
            className={cn("w-auto", isCollapsed ? "h-12" : "h-[56px]")}
          />
        </button>
      </SidebarHeader>

      <SidebarContent className="px-2 py-4">
        {/* Post Job */}
        <div className="px-2 mb-5">
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button
              onClick={() => { setOpenMobile(false); navigate("/post-job"); }}
              className={cn(
                "w-full justify-start gap-2 shadow-sm",
                isCollapsed && "justify-center px-0"
              )}
              size={isCollapsed ? "icon" : "default"}
            >
              <Plus className="h-4 w-4" />
              {!isCollapsed && <span>Post a Job</span>}
            </Button>
          </motion.div>
        </div>

        {/* Main Navigation */}
        <SidebarGroup>
          {!isCollapsed && (
            <SidebarGroupLabel className="text-[10px] font-semibold text-sidebar-foreground/50 uppercase tracking-widest px-2 mb-1">
              Dashboard
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const active = isActive(item.tab);
                return (
                  <SidebarMenuItem key={item.tab}>
                    <SidebarMenuButton
                      onClick={() => handleNavClick(item.tab)}
                      isActive={active}
                      tooltip={item.title}
                      className={cn(
                        "relative transition-all duration-200 group",
                        active && "bg-sidebar-accent text-sidebar-accent-foreground font-semibold"
                      )}
                    >
                      {/* Active indicator bar */}
                      {active && (
                        <motion.div
                          layoutId="sidebar-active-indicator"
                          className="absolute left-0 top-1 bottom-1 w-[3px] rounded-full bg-primary"
                          transition={{ type: "spring", stiffness: 350, damping: 30 }}
                        />
                      )}
                      <item.icon className={cn("h-4 w-4 shrink-0", active && "text-primary")} />
                      {!isCollapsed && (
                        <>
                          <span className="flex-1">{item.title}</span>
                          {active && <ChevronRight className="h-3.5 w-3.5 text-primary/60" />}
                        </>
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Settings */}
        <SidebarGroup className="mt-auto">
          {!isCollapsed && (
            <SidebarGroupLabel className="text-[10px] font-semibold text-sidebar-foreground/50 uppercase tracking-widest px-2 mb-1">
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
                  className="transition-all duration-200"
                >
                  <Building2 className="h-4 w-4" />
                  {!isCollapsed && <span>My Profile</span>}
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={toggleTheme}
                  tooltip="Toggle Theme"
                  className="transition-all duration-200"
                >
                  <motion.div
                    initial={false}
                    animate={{ rotate: theme === "dark" ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                  </motion.div>
                  {!isCollapsed && (
                    <span>{theme === "light" ? "Dark Mode" : "Light Mode"}</span>
                  )}
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer */}
      <SidebarFooter className="border-t border-sidebar-border p-3">
        <div className={cn("flex items-center gap-3 rounded-lg p-2 hover:bg-sidebar-accent/50 transition-colors", isCollapsed && "justify-center p-1")}>
          <Avatar className="h-8 w-8 shrink-0 ring-2 ring-primary/20">
            <AvatarImage src="" alt={user?.email || ""} />
            <AvatarFallback className="bg-primary text-primary-foreground text-xs font-bold">
              {getInitials(user?.email || "U")}
            </AvatarFallback>
          </Avatar>
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-sidebar-foreground truncate">
                {user?.email}
              </p>
              <p className="text-[10px] text-sidebar-foreground/50 font-medium uppercase tracking-wide">Recruiter</p>
            </div>
          )}
          {!isCollapsed && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSignOut}
              className="shrink-0 h-7 w-7 text-sidebar-foreground/40 hover:text-destructive hover:bg-destructive/10"
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
