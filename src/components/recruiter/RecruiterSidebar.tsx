import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
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
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { state, setOpenMobile } = useSidebar();
  const isCollapsed = state === "collapsed";

  const currentTab = searchParams.get("tab") || "resdex";

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  const getInitials = (email: string) => email.slice(0, 2).toUpperCase();

  const handleNavClick = (tab: string) => {
    setOpenMobile(false);
    if (tab === "resdex") {
      router.push("/recruiter-dashboard");
    } else {
      router.push(`/recruiter-dashboard?tab=${tab}`);
    }
  };

  const isActive = (tab: string) => {
    if (pathname !== "/recruiter-dashboard") return false;
    return currentTab === tab;
  };

  return (
    <Sidebar collapsible="icon" className="border-r-0">
      {/* Header */}
      <SidebarHeader className="px-4 py-5 border-b border-sidebar-border/50">
        <button
          onClick={() => router.push("/recruiter-dashboard")}
          className="flex items-center"
        >
          <img 
            src={theme === "dark" ? "/logo-dark.png" : "/logo-light.png"} 
            alt="OWL Roles" 
            className={cn(
              "w-auto transition-all duration-300",
              isCollapsed ? "h-10" : "h-12"
            )}
          />
        </button>
      </SidebarHeader>

      <SidebarContent className="px-3 py-4">
        {/* Post Job Button */}
        <div className="px-1 mb-5">
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
            <Button
              onClick={() => {
                setOpenMobile(false);
                router.push("/post-job");
              }}
              className={cn(
                "w-full justify-start gap-2.5 font-semibold shadow-md hover:shadow-lg transition-all duration-300",
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
            <SidebarGroupLabel className="text-[11px] font-semibold text-sidebar-foreground/40 uppercase tracking-[0.1em] px-3 mb-1">
              Dashboard
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu className="space-y-0.5">
              {navItems.map((item) => {
                const active = isActive(item.tab);
                return (
                  <SidebarMenuItem key={item.tab}>
                    <SidebarMenuButton
                      onClick={() => handleNavClick(item.tab)}
                      isActive={active}
                      tooltip={item.title}
                      className={cn(
                        "relative transition-all duration-200 rounded-lg h-10",
                        active
                          ? "bg-sidebar-accent text-sidebar-accent-foreground font-semibold"
                          : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
                      )}
                    >
                      {/* Active indicator bar */}
                      <AnimatePresence>
                        {active && (
                          <motion.div
                            layoutId="activeIndicator"
                            className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-full bg-primary"
                            initial={{ opacity: 0, scaleY: 0 }}
                            animate={{ opacity: 1, scaleY: 1 }}
                            exit={{ opacity: 0, scaleY: 0 }}
                            transition={{ type: "spring", stiffness: 300, damping: 25 }}
                          />
                        )}
                      </AnimatePresence>
                      <item.icon className={cn("h-[18px] w-[18px]", active && "text-primary")} />
                      {!isCollapsed && (
                        <span className="flex-1">{item.title}</span>
                      )}
                      {!isCollapsed && active && (
                        <ChevronRight className="h-3.5 w-3.5 text-primary/60" />
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Settings Section */}
        <SidebarGroup className="mt-auto">
          {!isCollapsed && (
            <SidebarGroupLabel className="text-[11px] font-semibold text-sidebar-foreground/40 uppercase tracking-[0.1em] px-3 mb-1">
              Settings
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu className="space-y-0.5">
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => {
                    setOpenMobile(false);
                    router.push("/recruiter-profile");
                  }}
                  tooltip="My Profile"
                  isActive={pathname === "/recruiter-profile"}
                  className={cn(
                    "transition-all duration-200 rounded-lg h-10",
                    pathname === "/recruiter-profile"
                      ? "bg-sidebar-accent text-sidebar-accent-foreground font-semibold"
                      : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
                  )}
                >
                  <Building2 className="h-[18px] w-[18px]" />
                  {!isCollapsed && <span>My Profile</span>}
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  onClick={toggleTheme} 
                  tooltip="Toggle Theme"
                  className="transition-all duration-200 rounded-lg h-10 text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
                >
                  <motion.div
                    initial={false}
                    animate={{ rotate: theme === "dark" ? 180 : 0 }}
                    transition={{ duration: 0.4, type: "spring", stiffness: 200 }}
                  >
                    {theme === "light" ? (
                      <Moon className="h-[18px] w-[18px]" />
                    ) : (
                      <Sun className="h-[18px] w-[18px]" />
                    )}
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
      <SidebarFooter className="border-t border-sidebar-border/50 p-3">
        <div
          className={cn(
            "flex items-center gap-3 rounded-lg p-2 transition-colors",
            isCollapsed ? "justify-center" : "hover:bg-sidebar-accent/30"
          )}
        >
          <Avatar className="h-9 w-9 shrink-0 ring-2 ring-sidebar-border/50 ring-offset-1 ring-offset-sidebar-background">
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
              <p className="text-[11px] text-sidebar-foreground/50 font-medium">Recruiter</p>
            </div>
          )}
          {!isCollapsed && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSignOut}
              className="shrink-0 h-8 w-8 text-sidebar-foreground/40 hover:text-destructive hover:bg-destructive/10 transition-colors"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
};

export default RecruiterSidebar;
