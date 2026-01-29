import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
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
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";

interface RecruiterSidebarProps {
  hasJobs?: boolean;
}

const RecruiterSidebar = ({ hasJobs = false }: RecruiterSidebarProps) => {
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  const currentTab = searchParams.get("tab") || "resdex";

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const getInitials = (email: string) => {
    return email.slice(0, 2).toUpperCase();
  };

  const navItems = [
    {
      title: "Find Candidates",
      icon: Search,
      tab: "resdex",
    },
    {
      title: "Applications",
      icon: FileText,
      tab: "applications",
    },
    {
      title: "My Jobs",
      icon: Briefcase,
      tab: "jobs",
    },
    {
      title: "Interviews",
      icon: Calendar,
      tab: "interviews",
    },
    {
      title: "Saved",
      icon: Bookmark,
      tab: "saved",
    },
    {
      title: "Messages",
      icon: MessageSquare,
      tab: "messages",
    },
  ];

  const handleNavClick = (tab: string) => {
    if (tab === "resdex") {
      navigate("/recruiter-dashboard");
    } else {
      navigate(`/recruiter-dashboard?tab=${tab}`);
    }
  };

  const isActive = (tab: string) => {
    if (location.pathname !== "/recruiter-dashboard") return false;
    return currentTab === tab;
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      {/* Header with Logo */}
      <SidebarHeader className="border-b border-sidebar-border px-4 py-4">
        <button
          onClick={() => navigate("/recruiter-dashboard")}
          className="flex items-center gap-3"
        >
          <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center shrink-0">
            <span className="text-primary-foreground font-heading font-bold text-lg">
              O
            </span>
          </div>
          {!isCollapsed && (
            <span className="font-heading font-bold text-lg text-sidebar-foreground">
              OWL ROLES
            </span>
          )}
        </button>
      </SidebarHeader>

      <SidebarContent className="px-2 py-4">
        {/* Post Job Button */}
        <div className="px-2 mb-4">
          <Button
            onClick={() => navigate("/post-job")}
            className={cn(
              "w-full justify-start gap-2",
              isCollapsed && "justify-center px-0"
            )}
            size={isCollapsed ? "icon" : "default"}
          >
            <Plus className="h-4 w-4" />
            {!isCollapsed && <span>Post a Job</span>}
          </Button>
        </div>

        {/* Main Navigation */}
        <SidebarGroup>
          {!isCollapsed && (
            <SidebarGroupLabel className="text-xs font-medium text-sidebar-foreground/60 uppercase tracking-wider px-2">
              Dashboard
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.tab}>
                  <SidebarMenuButton
                    onClick={() => handleNavClick(item.tab)}
                    isActive={isActive(item.tab)}
                    tooltip={item.title}
                    className={cn(
                      "transition-colors",
                      isActive(item.tab) &&
                        "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {!isCollapsed && <span>{item.title}</span>}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Profile Section */}
        <SidebarGroup className="mt-auto">
          {!isCollapsed && (
            <SidebarGroupLabel className="text-xs font-medium text-sidebar-foreground/60 uppercase tracking-wider px-2">
              Settings
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => navigate("/recruiter-profile")}
                  tooltip="My Profile"
                  isActive={location.pathname === "/recruiter-profile"}
                >
                  <Building2 className="h-4 w-4" />
                  {!isCollapsed && <span>My Profile</span>}
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={toggleTheme} tooltip="Toggle Theme">
                  {theme === "light" ? (
                    <Moon className="h-4 w-4" />
                  ) : (
                    <Sun className="h-4 w-4" />
                  )}
                  {!isCollapsed && (
                    <span>{theme === "light" ? "Dark Mode" : "Light Mode"}</span>
                  )}
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer with User Info */}
      <SidebarFooter className="border-t border-sidebar-border p-4">
        <div
          className={cn(
            "flex items-center gap-3",
            isCollapsed && "justify-center"
          )}
        >
          <Avatar className="h-8 w-8 shrink-0">
            <AvatarImage src="" alt={user?.email || ""} />
            <AvatarFallback className="bg-primary text-primary-foreground text-xs font-medium">
              {getInitials(user?.email || "U")}
            </AvatarFallback>
          </Avatar>
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">
                {user?.email}
              </p>
              <p className="text-xs text-sidebar-foreground/60">Recruiter</p>
            </div>
          )}
          {!isCollapsed && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSignOut}
              className="shrink-0 h-8 w-8 text-sidebar-foreground/60 hover:text-sidebar-foreground"
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
