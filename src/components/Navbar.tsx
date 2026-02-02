import { Link, useNavigate } from "react-router-dom";
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
import { Moon, Sun, LogOut, User, Plus, Briefcase, LayoutDashboard, Menu, Home, Building, Wrench } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import logoLight from "@/assets/logo-light.png";
import logoDark from "@/assets/logo-dark.png";

interface NavbarProps {
  onLoginClick?: () => void;
  onSignupClick?: () => void;
}

const Navbar = ({ onLoginClick, onSignupClick }: NavbarProps) => {
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [userType, setUserType] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const fetchUserType = async () => {
      if (!user) return;
      
      const { data } = await supabase
        .from("profiles")
        .select("user_type")
        .eq("id", user.id)
        .maybeSingle();
      
      if (data) {
        setUserType(data.user_type);
      }
    };

    fetchUserType();
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    setMobileMenuOpen(false);
    navigate("/");
  };

  const getInitials = (email: string) => {
    return email.slice(0, 2).toUpperCase();
  };

  const getDashboardLink = () => {
    if (userType === "recruiter") {
      return "/recruiter-dashboard";
    }
    return "/candidate-dashboard";
  };

  const navLinks = [
    { label: "Home", to: "/", icon: Home },
    { label: "Institutions", to: "/", icon: Building },
    { label: "Services", to: "/", icon: Wrench },
  ];

  const handleNavClick = (to: string) => {
    setMobileMenuOpen(false);
    navigate(to);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass-effect">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center py-1">
            <img 
              src={theme === "dark" ? logoDark : logoLight} 
              alt="OWL Roles" 
              className="h-[56px] w-auto"
            />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                to={link.to}
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                {link.label}
              </Link>
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

            {user ? (
              <>
                {userType === "recruiter" && (
                  <Link to="/post-job">
                    <Button className="hidden sm:flex gap-2">
                      <Plus className="h-4 w-4" />
                      Post Job
                    </Button>
                  </Link>
                )}
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
                        <p className="text-xs text-muted-foreground capitalize">{userType} Account</p>
                      </div>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to={getDashboardLink()} className="cursor-pointer">
                        <LayoutDashboard className="mr-2 h-4 w-4" />
                        Dashboard
                      </Link>
                    </DropdownMenuItem>
                    {userType === "recruiter" && (
                      <DropdownMenuItem asChild>
                        <Link to="/post-job" className="cursor-pointer sm:hidden">
                          <Briefcase className="mr-2 h-4 w-4" />
                          Post Job
                        </Link>
                      </DropdownMenuItem>
                    )}
                    {userType === "candidate" && (
                      <DropdownMenuItem asChild>
                        <Link to="/candidate-dashboard" className="cursor-pointer">
                          <User className="mr-2 h-4 w-4" />
                          My Profile
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer">
                      <LogOut className="mr-2 h-4 w-4" />
                      Log out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <div className="hidden sm:flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={onLoginClick}>
                  Login
                </Button>
                <Button size="sm" onClick={onSignupClick}>
                  Register
                </Button>
              </div>
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
                      variant="ghost"
                      className="justify-start gap-3 h-12"
                      onClick={() => handleNavClick(link.to)}
                    >
                      <link.icon className="h-5 w-5" />
                      {link.label}
                    </Button>
                  ))}

                  <div className="my-4 border-t" />

                  {user ? (
                    <>
                      {/* User Info */}
                      <div className="px-3 py-2 mb-2">
                        <p className="text-sm font-medium">{user.email}</p>
                        <p className="text-xs text-muted-foreground capitalize">{userType} Account</p>
                      </div>

                      <Button
                        variant="ghost"
                        className="justify-start gap-3 h-12"
                        onClick={() => handleNavClick(getDashboardLink())}
                      >
                        <LayoutDashboard className="h-5 w-5" />
                        Dashboard
                      </Button>

                      {userType === "recruiter" && (
                        <Button
                          variant="ghost"
                          className="justify-start gap-3 h-12"
                          onClick={() => handleNavClick("/post-job")}
                        >
                          <Briefcase className="h-5 w-5" />
                          Post Job
                        </Button>
                      )}

                      {userType === "candidate" && (
                        <Button
                          variant="ghost"
                          className="justify-start gap-3 h-12"
                          onClick={() => handleNavClick("/candidate-dashboard")}
                        >
                          <User className="h-5 w-5" />
                          My Profile
                        </Button>
                      )}

                      <div className="my-2 border-t" />

                      <Button
                        variant="ghost"
                        className="justify-start gap-3 h-12 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={handleSignOut}
                      >
                        <LogOut className="h-5 w-5" />
                        Log out
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        variant="outline"
                        className="h-12"
                        onClick={() => {
                          setMobileMenuOpen(false);
                          onLoginClick?.();
                        }}
                      >
                        Login
                      </Button>
                      <Button
                        className="h-12"
                        onClick={() => {
                          setMobileMenuOpen(false);
                          onSignupClick?.();
                        }}
                      >
                        Register
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

export default Navbar;
