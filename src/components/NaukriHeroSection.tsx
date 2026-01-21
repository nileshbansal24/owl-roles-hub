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
    <section className="relative bg-primary pt-28 pb-20 overflow-hidden">
      {/* Subtle Background Pattern */}
      <div className="absolute inset-0 opacity-[0.03]">
        <div 
          className="absolute inset-0" 
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} 
        />
      </div>

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/50 to-primary" />

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
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 mb-8"
          >
            <Sparkles className="w-4 h-4 text-primary-foreground" />
            <span className="text-sm text-white font-medium tracking-wide">AI-Powered Job Matching</span>
          </motion.div>

          {/* Main Heading */}
          <motion.h1 
            variants={itemVariants}
            className="font-heading text-4xl sm:text-5xl md:text-6xl font-extrabold text-white mb-2 leading-tight"
          >
            Your Gateway to
          </motion.h1>
          <motion.h1 
            variants={itemVariants}
            className="font-heading text-4xl sm:text-5xl md:text-6xl font-extrabold mb-6 leading-tight text-white"
          >
            <span className="text-primary-foreground">Academic</span>{" "}
            <span className="relative">
              Excellence
              <span className="absolute -bottom-2 left-0 w-full h-1 bg-white/80 rounded-full" />
            </span>
          </motion.h1>
          
          <motion.p 
            variants={itemVariants}
            className="text-white/85 text-lg md:text-xl mb-10 max-w-2xl mx-auto font-medium leading-relaxed"
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
                className="h-14 px-10 text-lg font-semibold bg-white text-primary hover:bg-white/95 shadow-xl gap-2 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                Get Started
                <ArrowRight className="w-5 h-5" />
              </Button>
            </motion.div>
          )}

          {/* Search Box */}
          <motion.div 
            variants={searchBoxVariants}
            className="bg-white rounded-2xl p-5 shadow-2xl max-w-3xl mx-auto"
          >
            <div className="flex flex-col md:flex-row gap-3">
              {/* Skills/Designation Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  placeholder="Skills, Designations, Keywords"
                  className="pl-12 h-12 text-base border-0 bg-secondary/50 focus-visible:ring-primary"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {/* Experience Dropdown */}
              <div className="md:w-44">
                <Select value={experienceFilter} onValueChange={setExperienceFilter}>
                  <SelectTrigger className="h-12 border-0 bg-secondary/50">
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
                  className="pl-12 h-12 text-base border-0 bg-secondary/50 focus-visible:ring-primary"
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
              className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-border/30"
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
                  className="px-3 py-1.5 text-sm rounded-full bg-secondary hover:bg-primary/10 hover:text-primary transition-all font-medium hover:scale-105 active:scale-95"
                >
                  {search}
                </motion.button>
              ))}
            </motion.div>
          </motion.div>

          {/* Trust Indicators */}
          <motion.div 
            className="flex flex-wrap items-center justify-center gap-6 mt-10 text-white/80 text-sm"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.5 }}
          >
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-accent" />
              <span>50,000+ Active Candidates</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary-foreground" />
              <span>500+ Partner Universities</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-white" />
              <span>AI-Powered Matching</span>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default NaukriHeroSection;