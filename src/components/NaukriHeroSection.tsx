import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Search, MapPin, Briefcase, ArrowRight, Upload } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import heroIllustration from "@/assets/hero-illustration.png";

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
  "Assistant Professor",
  "Research Scholar",
  "Lecturer",
  "PhD Position",
  "Postdoc",
];

const trustedBy = ["LPU", "Chitkara", "Amity", "IIT Delhi", "IIM Bangalore"];

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
  const [showSearch, setShowSearch] = useState(false);
  const navigate = useNavigate();

  const handleFindJobs = () => {
    if (isLoggedIn) {
      document.getElementById("featured-jobs")?.scrollIntoView({ behavior: "smooth" });
    } else {
      setShowSearch(true);
    }
  };

  const handleUploadResume = () => {
    if (isLoggedIn) {
      navigate("/candidate-dashboard");
    } else {
      onGetStarted?.();
    }
  };

  return (
    <section className="relative bg-background overflow-hidden">
      <div className="container mx-auto px-4 pt-28 pb-16 md:pt-32 md:pb-20">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          {/* Left: copy */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="max-w-xl"
          >
            <h1 className="font-heading font-extrabold text-foreground tracking-tight text-5xl sm:text-6xl lg:text-7xl leading-[1.05]">
              India's Dedicated Platform for{" "}
              <span className="text-gradient">Academic</span> Careers
            </h1>

            <p className="mt-6 text-lg md:text-xl text-muted-foreground leading-relaxed">
              Discover personalized job opportunities and connect with top companies hiring now.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button
                onClick={handleFindJobs}
                size="lg"
                className="h-12 px-6 text-sm font-semibold gap-2 shadow-lg shadow-primary/20"
              >
                <Search className="w-4 h-4" />
                Find Jobs Now
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={handleUploadResume}
                className="h-12 px-6 text-sm font-semibold gap-2"
              >
                <Upload className="w-4 h-4" />
                {isLoggedIn ? "Update Resume" : "Upload Resume"}
              </Button>
            </div>

            {/* Trusted by */}
            <div className="mt-10">
              <p className="text-xs font-semibold tracking-[0.18em] uppercase text-muted-foreground mb-3">
                Trusted by teams at
              </p>
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                {trustedBy.map((name) => (
                  <span
                    key={name}
                    className="font-heading font-bold text-base md:text-lg text-foreground/70"
                  >
                    {name}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Right: illustration */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
            className="relative hidden lg:block"
          >
            <img
              src={heroIllustration}
              alt="Educators and recruiters collaborating on OWL ROLES"
              width={1024}
              height={896}
              className="w-full h-auto max-w-[560px] mx-auto"
            />
          </motion.div>
        </div>

        {/* Expandable search bar */}
        <motion.div
          initial={false}
          animate={{
            height: showSearch ? "auto" : 0,
            opacity: showSearch ? 1 : 0,
            marginTop: showSearch ? 32 : 0,
          }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="overflow-hidden"
        >
          <div className="bg-card rounded-2xl p-4 md:p-5 shadow-xl border border-border max-w-3xl">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative group">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input
                  placeholder="Job title, keywords..."
                  className="pl-10 h-12 text-sm border-border bg-secondary/50"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="sm:w-40 relative group">
                <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors z-10" />
                <Input
                  placeholder="Location"
                  className="pl-10 h-12 text-sm border-border bg-secondary/50"
                  value={locationQuery}
                  onChange={(e) => setLocationQuery(e.target.value)}
                />
              </div>
              <div className="sm:w-36">
                <Select value={experienceFilter} onValueChange={setExperienceFilter}>
                  <SelectTrigger className="h-12 border-border bg-secondary/50 text-sm">
                    <Briefcase className="w-4 h-4 mr-1.5 text-muted-foreground" />
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
              <Button
                onClick={onSearch}
                className="h-12 px-6 text-sm font-semibold w-full sm:w-auto"
              >
                Search
              </Button>
            </div>
            <div className="flex flex-wrap items-center gap-2 mt-4 pt-3 border-t border-border/60">
              <span className="text-xs text-muted-foreground font-medium shrink-0">Popular:</span>
              {popularSearches.map((s) => (
                <button
                  key={s}
                  onClick={() => setSearchQuery(s)}
                  className="px-3 py-1.5 text-xs rounded-lg bg-secondary border border-border/50 hover:border-primary/40 hover:bg-primary/10 hover:text-primary text-muted-foreground transition-all font-medium"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default NaukriHeroSection;
