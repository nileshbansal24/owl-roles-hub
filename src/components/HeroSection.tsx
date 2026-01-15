import { useState, useEffect } from "react";
import { Search, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface HeroSectionProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  locationQuery: string;
  setLocationQuery: (query: string) => void;
}

const typingWords = ["Academia", "Education", "Research", "Innovation"];

const HeroSection = ({
  searchQuery,
  setSearchQuery,
  locationQuery,
  setLocationQuery,
}: HeroSectionProps) => {
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentWordIndex((prev) => (prev + 1) % typingWords.length);
        setIsAnimating(false);
      }, 200);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative pt-32 pb-20 overflow-hidden">
      {/* Background blobs */}
      <div className="blob-gradient blob-blue w-[400px] h-[400px] -top-20 -left-20 animate-float" />
      <div className="blob-gradient blob-purple w-[300px] h-[300px] top-40 right-10 animate-float" style={{ animationDelay: "-2s" }} />
      <div className="blob-gradient blob-blue w-[250px] h-[250px] bottom-10 left-1/3 animate-float" style={{ animationDelay: "-4s" }} />

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="font-heading text-4xl sm:text-5xl md:text-6xl font-bold text-foreground mb-6 animate-fade-in">
            Find Your Future in{" "}
            <span
              className={`text-gradient inline-block transition-all duration-200 ${
                isAnimating ? "opacity-0 translate-y-2" : "opacity-100 translate-y-0"
              }`}
            >
              {typingWords[currentWordIndex]}
            </span>
          </h1>
          <p className="text-lg text-muted-foreground mb-10 animate-fade-in" style={{ animationDelay: "0.1s" }}>
            Discover academic positions at top universities and research institutions worldwide.
            Your next career move starts here.
          </p>

          {/* Search form */}
          <div className="card-elevated p-3 flex flex-col sm:flex-row gap-3 animate-fade-in" style={{ animationDelay: "0.2s" }}>
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Job title, keywords..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12 border-0 bg-secondary/50 focus-visible:ring-1 focus-visible:ring-primary"
              />
            </div>
            <div className="relative flex-1">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Location..."
                value={locationQuery}
                onChange={(e) => setLocationQuery(e.target.value)}
                className="pl-10 h-12 border-0 bg-secondary/50 focus-visible:ring-1 focus-visible:ring-primary"
              />
            </div>
            <Button size="lg" className="h-12 px-8 font-medium">
              Search Jobs
            </Button>
          </div>

          {/* Stats */}
          <div className="flex items-center justify-center gap-8 mt-10 text-sm animate-fade-in" style={{ animationDelay: "0.3s" }}>
            <div>
              <span className="font-heading font-bold text-2xl text-foreground">2,500+</span>
              <p className="text-muted-foreground">Active Jobs</p>
            </div>
            <div className="w-px h-10 bg-border" />
            <div>
              <span className="font-heading font-bold text-2xl text-foreground">500+</span>
              <p className="text-muted-foreground">Universities</p>
            </div>
            <div className="w-px h-10 bg-border" />
            <div>
              <span className="font-heading font-bold text-2xl text-foreground">50+</span>
              <p className="text-muted-foreground">Countries</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;