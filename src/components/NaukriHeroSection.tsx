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

// Animated floating shapes component
const FloatingShapes = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    {/* Large gradient orbs */}
    <motion.div
      className="absolute -top-20 -right-20 w-[500px] h-[500px] rounded-full bg-gradient-to-br from-primary/25 via-primary/10 to-transparent blur-3xl"
      animate={{
        scale: [1, 1.15, 1],
        x: [0, 30, 0],
        y: [0, -30, 0],
        rotate: [0, 10, 0],
      }}
      transition={{
        duration: 12,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    />
    <motion.div
      className="absolute -bottom-40 -left-20 w-[400px] h-[400px] rounded-full bg-gradient-to-tr from-accent/20 via-primary/15 to-transparent blur-3xl"
      animate={{
        scale: [1, 1.2, 1],
        x: [0, -20, 0],
        y: [0, 20, 0],
        rotate: [0, -15, 0],
      }}
      transition={{
        duration: 15,
        repeat: Infinity,
        ease: "easeInOut",
        delay: 2,
      }}
    />
    <motion.div
      className="absolute top-1/3 left-1/4 w-72 h-72 rounded-full bg-gradient-to-r from-primary/15 to-accent/15 blur-2xl"
      animate={{
        scale: [1, 1.3, 1],
        opacity: [0.3, 0.6, 0.3],
        x: [0, 20, 0],
      }}
      transition={{
        duration: 8,
        repeat: Infinity,
        ease: "easeInOut",
        delay: 1,
      }}
    />
    <motion.div
      className="absolute top-1/2 right-1/4 w-56 h-56 rounded-full bg-gradient-to-bl from-accent/20 to-primary/10 blur-2xl"
      animate={{
        scale: [1, 1.25, 1],
        opacity: [0.2, 0.5, 0.2],
        y: [0, -30, 0],
      }}
      transition={{
        duration: 10,
        repeat: Infinity,
        ease: "easeInOut",
        delay: 3,
      }}
    />

    {/* Floating particles - various sizes */}
    {[...Array(8)].map((_, i) => (
      <motion.div
        key={`particle-${i}`}
        className="absolute rounded-full bg-primary/30"
        style={{
          width: 4 + (i % 3) * 2,
          height: 4 + (i % 3) * 2,
          left: `${10 + i * 12}%`,
          top: `${20 + (i % 4) * 20}%`,
        }}
        animate={{
          y: [0, -30 - (i % 3) * 10, 0],
          x: [0, (i % 2 === 0 ? 15 : -15), 0],
          opacity: [0.2, 0.6, 0.2],
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 4 + i * 0.5,
          repeat: Infinity,
          ease: "easeInOut",
          delay: i * 0.3,
        }}
      />
    ))}

    {/* Animated rings */}
    <motion.div
      className="absolute top-24 right-20 w-32 h-32 rounded-full border border-primary/10"
      animate={{
        scale: [1, 1.3, 1],
        opacity: [0.3, 0.1, 0.3],
        rotate: [0, 180, 360],
      }}
      transition={{
        duration: 20,
        repeat: Infinity,
        ease: "linear",
      }}
    />
    <motion.div
      className="absolute bottom-40 left-20 w-24 h-24 rounded-full border border-accent/15"
      animate={{
        scale: [1, 1.5, 1],
        opacity: [0.2, 0.05, 0.2],
        rotate: [360, 180, 0],
      }}
      transition={{
        duration: 15,
        repeat: Infinity,
        ease: "linear",
      }}
    />

    {/* Floating geometric shapes */}
    <motion.div
      className="absolute top-32 left-[15%] w-8 h-8 rotate-45 bg-gradient-to-br from-primary/20 to-transparent rounded-sm"
      animate={{
        y: [0, -20, 0],
        rotate: [45, 90, 45],
        opacity: [0.3, 0.5, 0.3],
      }}
      transition={{
        duration: 6,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    />
    <motion.div
      className="absolute bottom-48 right-[20%] w-6 h-6 bg-gradient-to-tr from-accent/25 to-transparent rounded-full"
      animate={{
        y: [0, 25, 0],
        x: [0, 15, 0],
        scale: [1, 1.3, 1],
        opacity: [0.4, 0.7, 0.4],
      }}
      transition={{
        duration: 7,
        repeat: Infinity,
        ease: "easeInOut",
        delay: 1,
      }}
    />
    <motion.div
      className="absolute top-1/2 right-16 w-5 h-5 rotate-12 bg-gradient-to-r from-primary/15 to-accent/15 rounded-sm"
      animate={{
        y: [0, -15, 0],
        rotate: [12, 60, 12],
        opacity: [0.2, 0.4, 0.2],
      }}
      transition={{
        duration: 5,
        repeat: Infinity,
        ease: "easeInOut",
        delay: 2,
      }}
    />

    {/* Subtle horizontal lines animation */}
    <motion.div
      className="absolute top-1/4 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/10 to-transparent"
      animate={{
        opacity: [0, 0.5, 0],
        scaleX: [0.5, 1, 0.5],
      }}
      transition={{
        duration: 8,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    />
    <motion.div
      className="absolute top-2/3 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent/10 to-transparent"
      animate={{
        opacity: [0, 0.3, 0],
        scaleX: [0.3, 0.8, 0.3],
      }}
      transition={{
        duration: 10,
        repeat: Infinity,
        ease: "easeInOut",
        delay: 3,
      }}
    />

    {/* Grid pattern overlay */}
    <div 
      className="absolute inset-0 opacity-[0.03]"
      style={{
        backgroundImage: `linear-gradient(rgba(37, 99, 235, 0.15) 1px, transparent 1px),
                          linear-gradient(90deg, rgba(37, 99, 235, 0.15) 1px, transparent 1px)`,
        backgroundSize: '60px 60px',
      }}
    />

    {/* Diagonal lines pattern */}
    <div 
      className="absolute inset-0 opacity-[0.015]"
      style={{
        backgroundImage: `repeating-linear-gradient(
          45deg,
          transparent,
          transparent 100px,
          rgba(37, 99, 235, 0.1) 100px,
          rgba(37, 99, 235, 0.1) 101px
        )`,
      }}
    />

    {/* Radial gradient spotlight effect */}
    <motion.div
      className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gradient-radial from-primary/5 via-transparent to-transparent"
      animate={{
        opacity: [0.5, 0.8, 0.5],
        scale: [1, 1.1, 1],
      }}
      transition={{
        duration: 6,
        repeat: Infinity,
        ease: "easeInOut",
      }}
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
      {/* Animated Background Effects */}
      <FloatingShapes />

      {/* Subtle top gradient */}
      <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-primary/5 to-transparent" />

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
