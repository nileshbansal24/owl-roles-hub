import { motion } from "framer-motion";
import { Search, MapPin, Briefcase, ArrowRight, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface NaukriHeroSectionProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  locationQuery: string;
  setLocationQuery: (query: string) => void;
  experienceFilter: string;
  setExperienceFilter: (exp: string) => void;
  onSearch: () => void;
  isLoggedIn?: boolean;
  onGetStarted?: () => void;
}

const experienceOptions = [
  "Fresher",
  "1-3 Years",
  "3-5 Years",
  "5-10 Years",
  "10+ Years",
];

const popularSearches = [
  "Professor",
  "Assistant Professor",
  "Research Associate",
  "Lecturer",
  "Dean",
  "Lab Technician",
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: "easeOut" as const,
    },
  },
};

const searchBoxVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.6,
      ease: "easeOut" as const,
      delay: 0.3,
    },
  },
};

// Subtle 2D decorative elements
const SubtleDecorations = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    {/* Soft dot grid */}
    <div 
      className="absolute inset-0 opacity-[0.04]"
      style={{
        backgroundImage: `radial-gradient(circle, hsl(var(--primary)) 1px, transparent 1px)`,
        backgroundSize: '32px 32px',
      }}
    />

    {/* Top-right soft gradient blob */}
    <div className="absolute -top-24 -right-24 w-[400px] h-[400px] rounded-full bg-primary/[0.04] blur-3xl" />

    {/* Bottom-left soft gradient blob */}
    <div className="absolute -bottom-32 -left-24 w-[350px] h-[350px] rounded-full bg-accent/[0.04] blur-3xl" />

    {/* Subtle floating circles */}
    <motion.div
      className="absolute top-20 right-[15%] w-3 h-3 rounded-full bg-primary/10"
      animate={{ y: [0, -12, 0] }}
      transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
    />
    <motion.div
      className="absolute top-[40%] left-[10%] w-2 h-2 rounded-full bg-primary/15"
      animate={{ y: [0, 10, 0] }}
      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
    />
    <motion.div
      className="absolute bottom-32 right-[25%] w-2.5 h-2.5 rounded-full bg-accent/10"
      animate={{ y: [0, -8, 0] }}
      transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 2 }}
    />
  </div>
);

const NaukriHeroSection = ({
  searchQuery,
  setSearchQuery,
  locationQuery,
  setLocationQuery,
  experienceFilter,
  setExperienceFilter,
  onSearch,
  isLoggedIn = false,
  onGetStarted,
}: NaukriHeroSectionProps) => {
  return (
    <section className="relative bg-background pt-28 pb-20 overflow-hidden">
      {/* Subtle 2D decorations */}
      <SubtleDecorations />

      {/* Subtle top gradient */}
      <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-primary/[0.03] to-transparent" />

      <div className="container mx-auto px-4 relative z-10">
        <motion.div 
          className="max-w-4xl mx-auto text-center"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Badge */}
          <motion.div 
            variants={itemVariants}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8"
          >
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm text-primary font-medium tracking-wide">AI-Powered Job Matching</span>
          </motion.div>

          {/* Main Heading */}
          <motion.h1 
            variants={itemVariants}
            className="font-heading text-4xl sm:text-5xl md:text-6xl font-extrabold text-foreground mb-2 leading-tight"
          >
            Your Gateway to
          </motion.h1>
          <motion.h1 
            variants={itemVariants}
            className="font-heading text-4xl sm:text-5xl md:text-6xl font-extrabold mb-6 leading-tight"
          >
            <span className="text-primary">Academic</span>{" "}
            <span className="relative text-foreground">
              Excellence
              <motion.span 
                className="absolute -bottom-2 left-0 w-full h-1.5 bg-gradient-to-r from-primary to-accent rounded-full"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 0.6, duration: 0.5, ease: "easeOut" }}
              />
            </span>
          </motion.h1>
          
          <motion.p 
            variants={itemVariants}
            className="text-muted-foreground text-lg md:text-xl mb-10 max-w-2xl mx-auto font-medium leading-relaxed"
          >
            Connect with 500+ top universities and discover 2,500+ academic opportunities tailored to your expertise
          </motion.p>

          {/* Get Started Button for Non-Logged Users */}
          {!isLoggedIn && (
            <motion.div 
              variants={itemVariants}
              className="mb-10"
            >
              <Button
                onClick={onGetStarted}
                size="lg"
                className="h-14 px-10 text-lg font-semibold bg-primary text-primary-foreground hover:bg-primary/90 shadow-xl shadow-primary/25 gap-2 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                Get Started
                <ArrowRight className="w-5 h-5" />
              </Button>
            </motion.div>
          )}

          {/* Search Box */}
          <motion.div 
            variants={searchBoxVariants}
            className="bg-card rounded-2xl p-5 shadow-2xl shadow-primary/10 max-w-3xl mx-auto border border-border"
          >
            <div className="flex flex-col md:flex-row gap-3">
              {/* Skills/Designation Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  placeholder="Skills, Designations, Keywords"
                  className="pl-12 h-12 text-base border-border bg-secondary/50 focus-visible:ring-primary"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {/* Experience Dropdown */}
              <div className="md:w-44">
                <Select value={experienceFilter} onValueChange={setExperienceFilter}>
                  <SelectTrigger className="h-12 border-border bg-secondary/50">
                    <Briefcase className="w-4 h-4 mr-2 text-muted-foreground" />
                    <SelectValue placeholder="Experience" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover">
                    <SelectItem value="all">All Experience</SelectItem>
                    {experienceOptions.map((exp) => (
                      <SelectItem key={exp} value={exp}>{exp}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Location Search */}
              <div className="md:w-44 relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground z-10" />
                <Input
                  placeholder="Location"
                  className="pl-12 h-12 text-base border-border bg-secondary/50 focus-visible:ring-primary"
                  value={locationQuery}
                  onChange={(e) => setLocationQuery(e.target.value)}
                />
              </div>

              {/* Search Button */}
              <Button 
                onClick={onSearch}
                className="h-12 px-8 text-base font-semibold transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                Search Jobs
              </Button>
            </div>

            {/* Popular Searches */}
            <motion.div 
              className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-border/50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.4 }}
            >
              <span className="text-sm text-muted-foreground">Popular:</span>
              {popularSearches.map((search, index) => (
                <motion.button
                  key={search}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.7 + index * 0.05, duration: 0.3 }}
                  onClick={() => setSearchQuery(search)}
                  className="px-3 py-1.5 text-sm rounded-full bg-secondary hover:bg-primary/10 text-foreground hover:text-primary transition-all font-medium hover:scale-105 active:scale-95"
                >
                  {search}
                </motion.button>
              ))}
            </motion.div>
          </motion.div>

          {/* Trust Indicators */}
          <motion.div 
            className="flex flex-wrap items-center justify-center gap-6 mt-10 text-muted-foreground text-sm"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.5 }}
          >
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-accent" />
              <span>50,000+ Active Candidates</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary" />
              <span>500+ Partner Universities</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-muted-foreground" />
              <span>AI-Powered Matching</span>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default NaukriHeroSection;
