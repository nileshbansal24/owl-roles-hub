import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Moon, Sun, LogOut, Plus, LayoutDashboard, Menu, Calendar, User, Building2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useState } from "react";
import logoLight from "@/assets/logo-light.png";
import logoDark from "@/assets/logo-dark.png";

const RecruiterNavbar = () => {
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    setMobileMenuOpen(false);
    navigate("/");
  };

  const getInitials = (email: string) => {
    return email.slice(0, 2).toUpperCase();
  };

  const navLinks = [
    { label: "Dashboard", to: "/recruiter-dashboard", icon: LayoutDashboard },
    { label: "My Profile", to: "/recruiter-profile", icon: Building2 },
    { label: "Post a Job", to: "/post-job", icon: Plus },
    { label: "Interviews", to: "/recruiter-dashboard?tab=interviews", icon: Calendar },
  ];

  const handleNavClick = (to: string) => {
    setMobileMenuOpen(false);
    if (to.includes("?tab=")) {
      const [path, query] = to.split("?");
      navigate(path + "?" + query);
    } else {
      navigate(to);
    }
  };

  const isActive = (to: string) => {
    if (to.includes("?tab=")) {
      const tabParam = new URLSearchParams(to.split("?")[1]).get("tab");
      const currentTab = new URLSearchParams(location.search).get("tab");
      return location.pathname === "/recruiter-dashboard" && currentTab === tabParam;
    }
    return location.pathname === to && !location.search.includes("tab=");
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass-effect">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/recruiter-dashboard" className="flex items-center py-1">
            <img 
              src={theme === "dark" ? logoDark : logoLight} 
              alt="OWL Roles" 
              className="h-[56px] w-auto"
            />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <button
                key={link.label}
                onClick={() => handleNavClick(link.to)}
                className={`text-sm font-medium transition-colors flex items-center gap-2 ${
                  isActive(link.to)
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <link.icon className="h-4 w-4" />
                {link.label}
              </button>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="rounded-full"
            >
              {theme === "light" ? (
                <Moon className="h-5 w-5" />
              ) : (
                <Sun className="h-5 w-5" />
              )}
            </Button>

            {user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src="" alt={user.email || ""} />
                      <AvatarFallback className="bg-primary text-primary-foreground font-medium">
                        {getInitials(user.email || "U")}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 bg-popover" align="end" forceMount>
                  <div className="flex items-center justify-start gap-2 p-2">
                    <div className="flex flex-col space-y-1 leading-none">
                      <p className="font-medium text-sm">{user.email}</p>
                      <p className="text-xs text-muted-foreground">Recruiter Account</p>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/recruiter-profile" className="cursor-pointer">
                      <Building2 className="mr-2 h-4 w-4" />
                      My Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/recruiter-dashboard" className="cursor-pointer">
                      <LayoutDashboard className="mr-2 h-4 w-4" />
                      Dashboard
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/post-job" className="cursor-pointer">
                      <Plus className="mr-2 h-4 w-4" />
                      Post a Job
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {/* Mobile Menu Button */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[280px] sm:w-[320px]">
                <SheetHeader>
                  <SheetTitle className="text-left font-heading">Menu</SheetTitle>
                </SheetHeader>
                <div className="mt-6 flex flex-col gap-2">
                  {/* Navigation Links */}
                  {navLinks.map((link) => (
                    <Button
                      key={link.label}
                      variant={isActive(link.to) ? "secondary" : "ghost"}
                      className="justify-start gap-3 h-12"
                      onClick={() => handleNavClick(link.to)}
                    >
                      <link.icon className="h-5 w-5" />
                      {link.label}
                    </Button>
                  ))}

                  <div className="my-4 border-t" />

                  {user && (
                    <>
                      {/* User Info */}
                      <div className="px-3 py-2 mb-2">
                        <p className="text-sm font-medium">{user.email}</p>
                        <p className="text-xs text-muted-foreground">Recruiter Account</p>
                      </div>

                      <Button
                        variant="ghost"
                        className="justify-start gap-3 h-12 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={handleSignOut}
                      >
                        <LogOut className="h-5 w-5" />
                        Log out
                      </Button>
                    </>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
};

export default RecruiterNavbar;
