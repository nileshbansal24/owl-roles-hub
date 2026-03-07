import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import RecruiterSidebar from "./RecruiterSidebar";
import { motion } from "framer-motion";
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
          <header className="h-14 border-b border-border/60 flex items-center gap-3 px-3 sm:px-5 bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60 shrink-0 sticky top-0 z-10">
            <SidebarTrigger className="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground transition-colors" />
            {title && (
              <motion.h1 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="font-heading font-bold text-base sm:text-lg text-foreground truncate"
              >
                {title}
              </motion.h1>
            )}
          </header>
          
          {/* Main content area */}
          <div className="flex-1 overflow-auto">
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            >
              {children}
            </motion.div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default RecruiterLayout;
