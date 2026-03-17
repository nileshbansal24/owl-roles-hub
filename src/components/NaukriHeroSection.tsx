import { useState, useEffect } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform } from "framer-motion";
import { Search, MapPin, Briefcase, ArrowRight, Sparkles, TrendingUp, Shield, Zap, GraduationCap, BookOpen, Atom } from "lucide-react";
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

const rotatingWords = ["Academic Excellence", "Research Careers", "Teaching Roles", "Innovation Hubs"];

const floatingIcons = [
  { Icon: GraduationCap, x: "8%", y: "18%", size: 28, delay: 0 },
  { Icon: BookOpen, x: "85%", y: "22%", size: 24, delay: 1.2 },
  { Icon: Atom, x: "12%", y: "68%", size: 22, delay: 0.6 },
  { Icon: Briefcase, x: "88%", y: "65%", size: 20, delay: 1.8 },
  { Icon: Shield, x: "92%", y: "40%", size: 18, delay: 2.4 },
  { Icon: Zap, x: "5%", y: "45%", size: 20, delay: 0.3 },
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
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [mouseX, setMouseX] = useState(0);
  const [mouseY, setMouseY] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentWordIndex((prev) => (prev + 1) % rotatingWords.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMouseX((e.clientX - rect.left) / rect.width - 0.5);
    setMouseY((e.clientY - rect.top) / rect.height - 0.5);
  };

  return (
    <section
      className="relative bg-background pt-24 sm:pt-32 pb-14 sm:pb-24 overflow-hidden min-h-[90vh] flex items-center"
      onMouseMove={handleMouseMove}
    >
      {/* Animated gradient orbs */}
      <motion.div
        className="absolute top-[-10%] left-[20%] w-[600px] h-[600px] rounded-full opacity-[0.07]"
        style={{ background: "radial-gradient(circle, hsl(var(--primary)), transparent 70%)" }}
        animate={{
          x: [0, 40, -20, 0],
          y: [0, -30, 20, 0],
          scale: [1, 1.15, 0.95, 1],
        }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-[-5%] right-[10%] w-[500px] h-[500px] rounded-full opacity-[0.05]"
        style={{ background: "radial-gradient(circle, hsl(var(--accent)), transparent 70%)" }}
        animate={{
          x: [0, -30, 20, 0],
          y: [0, 25, -15, 0],
          scale: [1, 1.1, 1.05, 1],
        }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut", delay: 2 }}
      />
      <motion.div
        className="absolute top-[40%] left-[-5%] w-[350px] h-[350px] rounded-full opacity-[0.04]"
        style={{ background: "radial-gradient(circle, hsl(260 70% 60%), transparent 70%)" }}
        animate={{
          x: [0, 20, -10, 0],
          y: [0, -20, 10, 0],
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      />

      {/* Dot grid with parallax */}
      <motion.div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `radial-gradient(circle, hsl(var(--primary)) 1px, transparent 1px)`,
          backgroundSize: '32px 32px',
          x: mouseX * -8,
          y: mouseY * -8,
        }}
      />

      {/* Animated grid lines */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-0 left-[25%] w-px h-full bg-gradient-to-b from-transparent via-primary/10 to-transparent"
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute top-0 left-[75%] w-px h-full bg-gradient-to-b from-transparent via-primary/10 to-transparent"
          animate={{ opacity: [0.2, 0.5, 0.2] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
        />
        <motion.div
          className="absolute left-0 top-[35%] h-px w-full bg-gradient-to-r from-transparent via-primary/8 to-transparent"
          animate={{ opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 0.8 }}
        />
      </div>

      {/* Floating academic icons with parallax */}
      {floatingIcons.map(({ Icon, x, y, size, delay }, i) => (
        <motion.div
          key={i}
          className="absolute text-primary/[0.12] hidden md:block"
          style={{ left: x, top: y }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{
            opacity: 1,
            scale: 1,
            x: mouseX * (15 + i * 5),
            y: mouseY * (15 + i * 5),
          }}
          transition={{
            opacity: { delay: 0.5 + delay * 0.3, duration: 0.8 },
            scale: { delay: 0.5 + delay * 0.3, duration: 0.8, type: "spring" },
            x: { duration: 0.3, ease: "easeOut" },
            y: { duration: 0.3, ease: "easeOut" },
          }}
        >
          <motion.div
            animate={{
              y: [0, -12, 0],
              rotate: [0, i % 2 === 0 ? 8 : -8, 0],
            }}
            transition={{
              duration: 5 + i,
              repeat: Infinity,
              ease: "easeInOut",
              delay,
            }}
          >
            <Icon size={size} strokeWidth={1.5} />
          </motion.div>
        </motion.div>
      ))}

      {/* Floating particles */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={`particle-${i}`}
          className="absolute rounded-full bg-primary/20 hidden sm:block"
          style={{
            width: 3 + (i % 3) * 2,
            height: 3 + (i % 3) * 2,
            left: `${15 + i * 14}%`,
            top: `${20 + (i % 3) * 25}%`,
          }}
          animate={{
            y: [0, -30 - i * 5, 0],
            x: [0, (i % 2 === 0 ? 15 : -15), 0],
            opacity: [0.3, 0.7, 0.3],
            scale: [1, 1.5, 1],
          }}
          transition={{
            duration: 4 + i * 0.7,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.5,
          }}
        />
      ))}

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge with glow */}
          <motion.div
            initial={{ opacity: 0, y: -30, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.7, type: "spring", bounce: 0.4 }}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary/10 border border-primary/20 mb-8 relative"
          >
            <motion.div
              className="absolute inset-0 rounded-full bg-primary/5"
              animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0, 0.5] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            >
              <Sparkles className="w-4 h-4 text-primary" />
            </motion.div>
            <span className="text-sm text-primary font-semibold tracking-wide relative">AI-Powered Job Matching</span>
          </motion.div>

          {/* Main Heading with stagger */}
          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.15 }}
            className="font-heading text-4xl sm:text-5xl md:text-[3.5rem] lg:text-6xl font-extrabold text-foreground mb-2 leading-[1.1] tracking-tight"
          >
            Your Gateway to
          </motion.h1>

          {/* Rotating text line */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="font-heading text-4xl sm:text-5xl md:text-[3.5rem] lg:text-6xl font-extrabold mb-7 leading-[1.1] tracking-tight h-[1.2em] relative overflow-hidden"
          >
            <AnimatePresence mode="wait">
              <motion.span
                key={currentWordIndex}
                initial={{ y: 50, opacity: 0, rotateX: -40 }}
                animate={{ y: 0, opacity: 1, rotateX: 0 }}
                exit={{ y: -50, opacity: 0, rotateX: 40 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="text-gradient inline-block absolute left-0 right-0"
              >
                {rotatingWords[currentWordIndex]}
              </motion.span>
            </AnimatePresence>
            <motion.span
              className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-32 h-1 bg-gradient-to-r from-transparent via-primary to-transparent rounded-full"
              animate={{ width: ["0%", "40%", "30%"] }}
              transition={{ delay: 0.8, duration: 1, ease: "easeOut" }}
            />
          </motion.div>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.45 }}
            className="text-muted-foreground text-base sm:text-lg md:text-xl mb-10 max-w-2xl mx-auto font-medium leading-relaxed px-2"
          >
            Connect with 500+ top universities and discover 2,500+ academic opportunities tailored to your expertise
          </motion.p>

          {/* Get Started Button */}
          {!isLoggedIn && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.55 }}
              className="mb-10"
            >
              <motion.div
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.97 }}
                className="inline-block relative"
              >
                {/* Button glow */}
                <motion.div
                  className="absolute inset-0 rounded-lg bg-primary/30 blur-xl"
                  animate={{ opacity: [0.4, 0.7, 0.4], scale: [0.9, 1.05, 0.9] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                />
                <Button
                  onClick={onGetStarted}
                  size="lg"
                  className="relative h-14 px-10 text-lg font-bold bg-primary text-primary-foreground hover:bg-primary/90 shadow-xl shadow-primary/25 gap-2.5"
                >
                  Get Started
                  <motion.div
                    animate={{ x: [0, 4, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <ArrowRight className="w-5 h-5" />
                  </motion.div>
                </Button>
              </motion.div>
            </motion.div>
          )}

          {/* Search Box */}
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.6, type: "spring", bounce: 0.2 }}
            className="bg-card rounded-2xl p-5 shadow-2xl shadow-primary/[0.08] max-w-3xl mx-auto border border-border/80 relative"
          >
            {/* Shimmer border effect */}
            <motion.div
              className="absolute inset-0 rounded-2xl pointer-events-none"
              style={{
                background: "linear-gradient(90deg, transparent, hsl(var(--primary) / 0.1), transparent)",
                backgroundSize: "200% 100%",
              }}
              animate={{ backgroundPosition: ["200% 0", "-200% 0"] }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear", delay: 2 }}
            />

            <div className="flex flex-col md:flex-row gap-3 relative">
              <div className="flex-1 relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input
                  placeholder="Skills, Designations, Keywords"
                  className="pl-12 h-12 text-base border-border bg-secondary/50 focus-visible:ring-primary"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
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
              <div className="md:w-44 relative group">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors z-10" />
                <Input
                  placeholder="Location"
                  className="pl-12 h-12 text-base border-border bg-secondary/50 focus-visible:ring-primary"
                  value={locationQuery}
                  onChange={(e) => setLocationQuery(e.target.value)}
                />
              </div>
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                <Button
                  onClick={onSearch}
                  className="h-12 px-8 text-base font-semibold w-full md:w-auto"
                >
                  Search Jobs
                </Button>
              </motion.div>
            </div>

            {/* Popular Searches */}
            <motion.div
              className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-border/50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2, duration: 0.5 }}
            >
              <span className="text-sm text-muted-foreground font-medium">Popular:</span>
              {popularSearches.map((search, index) => (
                <motion.button
                  key={search}
                  initial={{ opacity: 0, scale: 0.7, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{
                    delay: 1.3 + index * 0.08,
                    duration: 0.4,
                    type: "spring",
                    bounce: 0.3,
                  }}
                  whileHover={{ scale: 1.08, y: -2, backgroundColor: "hsl(var(--primary) / 0.12)" }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSearchQuery(search)}
                  className="px-3.5 py-1.5 text-sm rounded-full bg-secondary hover:text-primary text-foreground transition-colors font-medium"
                >
                  {search}
                </motion.button>
              ))}
            </motion.div>
          </motion.div>

          {/* Trust Indicators with counter animation */}
          <motion.div
            className="flex flex-wrap items-center justify-center gap-6 sm:gap-8 mt-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.4, duration: 0.7 }}
          >
            {[
              { icon: TrendingUp, value: "50,000+", label: "Active Candidates", bg: "bg-accent/10" },
              { icon: Shield, value: "500+", label: "Partner Universities", bg: "bg-primary/10" },
              { icon: Zap, value: "AI-Powered", label: "Smart Matching", bg: "bg-primary/10" },
            ].map((item, i) => (
              <motion.div
                key={item.label}
                className="flex items-center gap-2.5 text-muted-foreground text-sm"
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.5 + i * 0.15, duration: 0.5 }}
                whileHover={{ scale: 1.08, y: -2 }}
              >
                <motion.div
                  className={`w-9 h-9 rounded-xl ${item.bg} flex items-center justify-center`}
                  whileHover={{ rotate: [0, -10, 10, 0] }}
                  transition={{ duration: 0.4 }}
                >
                  <item.icon className="w-4 h-4 text-primary" />
                </motion.div>
                <span className="font-semibold">{item.value} {item.label}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default NaukriHeroSection;
