import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import RecruiterSidebar from "./RecruiterSidebar";
import { cn } from "@/lib/utils";

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
          <header className="h-14 border-b border-border flex items-center gap-3 px-3 sm:px-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shrink-0">
            <SidebarTrigger className="h-8 w-8 shrink-0" />
            {title && (
              <h1 className="font-heading font-semibold text-base sm:text-lg text-foreground truncate">
                {title}
              </h1>
            )}
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
