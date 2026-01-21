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
    <section className="relative bg-gradient-to-br from-primary via-primary/95 to-primary/85 pt-28 pb-20 overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 left-0 w-full h-full" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      {/* Animated Gradient Orbs */}
      <motion.div
        className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-gradient-to-br from-white/10 to-transparent blur-3xl"
        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 8, repeat: Infinity }}
      />
      <motion.div
        className="absolute -bottom-48 -left-32 w-[500px] h-[500px] rounded-full bg-gradient-to-tr from-white/10 to-transparent blur-3xl"
        animate={{ scale: [1, 1.1, 1], opacity: [0.2, 0.4, 0.2] }}
        transition={{ duration: 10, repeat: Infinity }}
      />

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-5xl mx-auto">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-center mb-6"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20">
              <Sparkles className="w-4 h-4 text-accent-foreground" />
              <span className="text-sm text-white/90 font-medium">AI-Powered Job Matching</span>
            </div>
          </motion.div>

          {/* Main Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="font-heading text-4xl sm:text-5xl md:text-6xl font-bold text-white text-center mb-6 leading-tight"
          >
            Your Gateway to
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent via-accent to-accent-foreground">
              Academic Excellence
            </span>
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-white/80 text-lg md:text-xl text-center mb-10 max-w-2xl mx-auto"
          >
            Connect with 500+ top universities and discover 2,500+ academic opportunities tailored to your expertise
          </motion.p>

          {/* Get Started Button for Non-Logged Users */}
          {!isLoggedIn && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex justify-center mb-10"
            >
              <Button
                onClick={onGetStarted}
                size="lg"
                className="h-14 px-10 text-lg font-semibold bg-white text-primary hover:bg-white/90 shadow-2xl shadow-black/20 gap-2 group"
              >
                Get Started
                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              </Button>
            </motion.div>
          )}

          {/* Search Box */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: isLoggedIn ? 0.3 : 0.4 }}
            className="bg-white/95 backdrop-blur-sm rounded-2xl p-5 shadow-2xl shadow-black/10 border border-white/50"
          >
            <div className="flex flex-col md:flex-row gap-3">
              {/* Skills/Designation Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  placeholder="Skills, Designations, Keywords"
                  className="pl-12 h-12 text-base border-0 bg-secondary/40 focus-visible:ring-primary"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {/* Experience Dropdown */}
              <div className="md:w-44">
                <Select value={experienceFilter} onValueChange={setExperienceFilter}>
                  <SelectTrigger className="h-12 border-0 bg-secondary/40">
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
              <div className="md:w-48 relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground z-10" />
                <Input
                  placeholder="Location"
                  className="pl-12 h-12 text-base border-0 bg-secondary/40 focus-visible:ring-primary"
                  value={locationQuery}
                  onChange={(e) => setLocationQuery(e.target.value)}
                />
              </div>

              {/* Search Button */}
              <Button 
                onClick={onSearch}
                className="h-12 px-8 text-base font-semibold"
              >
                Search Jobs
              </Button>
            </div>

            {/* Popular Searches */}
            <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-border/30">
              <span className="text-sm text-muted-foreground">Popular:</span>
              {popularSearches.map((search, index) => (
                <motion.button
                  key={search}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 + index * 0.05 }}
                  onClick={() => setSearchQuery(search)}
                  className="px-3 py-1.5 text-sm rounded-full bg-secondary/60 hover:bg-primary/10 hover:text-primary transition-colors font-medium"
                >
                  {search}
                </motion.button>
              ))}
            </div>
          </motion.div>

          {/* Trust Indicators */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="flex flex-wrap items-center justify-center gap-6 mt-8 text-white/70 text-sm"
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
              <div className="w-2 h-2 rounded-full bg-secondary" />
              <span>AI-Powered Matching</span>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default NaukriHeroSection;
