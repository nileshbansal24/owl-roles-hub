import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import RecruiterSidebar from "./RecruiterSidebar";
import { Bell, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
          {/* Top header bar */}
          <header className="h-14 border-b border-border flex items-center justify-between gap-3 px-3 sm:px-5 bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60 shrink-0 sticky top-0 z-10">
            <div className="flex items-center gap-3 min-w-0">
              <SidebarTrigger className="h-8 w-8 shrink-0" />
              {title && (
                <div className="flex items-center gap-2 min-w-0">
                  <div className="h-5 w-0.5 rounded-full bg-primary/40 hidden sm:block" />
                  <h1 className="font-heading font-bold text-base sm:text-lg text-foreground truncate">
                    {title}
                  </h1>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <div className="hidden md:flex items-center relative">
                <Search className="absolute left-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <Input 
                  placeholder="Quick search..." 
                  className="pl-8 h-8 w-48 lg:w-64 text-sm bg-muted/50 border-none focus-visible:ring-1"
                />
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8 relative">
                <Bell className="h-4 w-4" />
                <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-primary animate-pulse" />
              </Button>
            </div>
          </header>
          
          {/* Main content area */}
          <div className="flex-1 overflow-auto">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default RecruiterLayout;
