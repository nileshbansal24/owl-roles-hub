import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import RecruiterSidebar from "./RecruiterSidebar";
import { Search, Command } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import NotificationCenter from "./NotificationCenter";

interface RecruiterLayoutProps {
  children: React.ReactNode;
  hasJobs?: boolean;
  title?: string;
  pendingVerificationCount?: number;
}

const RecruiterLayout = ({ children, hasJobs = false, title, pendingVerificationCount = 0 }: RecruiterLayoutProps) => {
  return (
    <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen flex w-full bg-background">
        <RecruiterSidebar hasJobs={hasJobs} pendingVerificationCount={pendingVerificationCount} />
        
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
              <NotificationCenter />

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
