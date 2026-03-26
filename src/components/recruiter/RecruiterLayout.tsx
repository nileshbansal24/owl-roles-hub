import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import RecruiterSidebar from "./RecruiterSidebar";
import { Bell, Search, Command } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface RecruiterLayoutProps {
  children: React.ReactNode;
  hasJobs?: boolean;
  title?: string;
}

const RecruiterLayout = ({ children, hasJobs = false, title }: RecruiterLayoutProps) => {
  return (
    <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen flex w-full bg-background">
        <RecruiterSidebar hasJobs={hasJobs} />
        
        <main className="flex-1 flex flex-col min-h-screen overflow-hidden min-w-0">
          {/* Refined top header */}
          <header className="h-14 border-b border-border/60 flex items-center justify-between gap-3 px-4 sm:px-6 bg-background/95 backdrop-blur-sm supports-[backdrop-filter]:bg-background/80 shrink-0 sticky top-0 z-10">
            <div className="flex items-center gap-3 min-w-0">
              <SidebarTrigger className="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground transition-colors" />
              {title && (
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="h-4 w-px bg-border hidden sm:block" />
                  <h1 className="font-heading font-semibold text-sm sm:text-base text-foreground truncate tracking-tight">
                    {title}
                  </h1>
                </div>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              {/* Search with keyboard shortcut hint */}
              <div className="hidden md:flex items-center relative group">
                <Search className="absolute left-3 h-3.5 w-3.5 text-muted-foreground/60 group-focus-within:text-primary transition-colors" />
                <Input 
                  placeholder="Search anything..." 
                  className="pl-9 pr-12 h-8 w-52 lg:w-72 text-sm bg-muted/40 border-border/50 rounded-lg focus-visible:ring-1 focus-visible:bg-background transition-all"
                />
                <div className="absolute right-2 flex items-center gap-0.5">
                  <kbd className="hidden lg:inline-flex h-5 select-none items-center gap-0.5 rounded border border-border/60 bg-muted/60 px-1.5 font-mono text-[10px] font-medium text-muted-foreground/70">
                    <Command className="h-2.5 w-2.5" />K
                  </kbd>
                </div>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8 relative rounded-lg text-muted-foreground hover:text-foreground">
                <Bell className="h-4 w-4" />
                <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-primary ring-2 ring-background" />
              </Button>
            </div>
          </header>
          
          {/* Content with subtle background pattern */}
          <div className="flex-1 overflow-auto bg-muted/20">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default RecruiterLayout;
