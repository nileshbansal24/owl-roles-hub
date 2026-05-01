import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Quote, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface Testimonial {
  id: number;
  quote: string;
  name: string;
  role: string;
  institution: string;
  type: "candidate" | "recruiter";
  rating: number;
}

const testimonials: Testimonial[] = [
  { id: 1, quote: "OWL ROLES helped me transition from a lecturer to an Associate Professor at IIT Delhi. The AI matching understood my research profile perfectly!", name: "Dr. Priya Sharma", role: "Associate Professor, Computer Science", institution: "IIT Delhi", type: "candidate", rating: 5 },
  { id: 2, quote: "Finding UGC-NET qualified faculty was always challenging. OWL ROLES streamlined our entire recruitment process and we hired 12 exceptional candidates.", name: "Prof. Rajesh Verma", role: "Dean of Engineering", institution: "NIT Trichy", type: "recruiter", rating: 5 },
  { id: 3, quote: "Within 3 weeks of joining OWL ROLES, I received interview calls from 5 prestigious universities! The platform truly understands academic hiring.", name: "Dr. Ananya Krishnan", role: "Assistant Professor, Economics", institution: "Delhi School of Economics", type: "candidate", rating: 5 },
  { id: 4, quote: "We could filter candidates by UGC-NET, GATE scores, and research publications. Highly recommended for all educational institutions.", name: "Dr. Suresh Nair", role: "Director", institution: "IIIT Hyderabad", type: "recruiter", rating: 5 },
  { id: 5, quote: "I was a visiting faculty for 8 years before OWL ROLES helped me secure a permanent position. The resume parser highlighted my publications perfectly.", name: "Dr. Meera Iyer", role: "Professor, Mathematics", institution: "Chennai Mathematical Institute", type: "candidate", rating: 5 },
  { id: 6, quote: "Our network of 25 colleges uses OWL ROLES for all faculty recruitment. The quality of candidates and the streamlined process is unmatched.", name: "Dr. Lakshmi Rao", role: "Vice Chancellor", institution: "VIT University", type: "recruiter", rating: 5 },
];

const StarRating = ({ rating }: { rating: number }) => (
  <div className="flex items-center gap-0.5">
    {[1, 2, 3, 4, 5].map((star) => (
      <Star
        key={star}
        className={`h-4 w-4 ${star <= rating ? "fill-amber-400 text-amber-400" : "fill-muted text-muted"}`}
      />
    ))}
  </div>
);

const TestimonialsSection = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);

  const nextSlide = useCallback(() => {
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  }, []);

  const prevSlide = useCallback(() => {
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  }, []);

  useEffect(() => {
    const timer = setInterval(nextSlide, 6000);
    return () => clearInterval(timer);
  }, [nextSlide]);

  const current = testimonials[currentIndex];

  return (
    <section className="py-12 overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="font-heading text-2xl md:text-4xl font-extrabold text-foreground mb-3 tracking-tight">
            Real Stories from Higher Education
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Educators and institutions sharing what changed when they joined OWL ROLES.
          </p>
        </div>

        <div className="relative max-w-3xl mx-auto">
          <Button variant="outline" size="icon" onClick={prevSlide} className="absolute -left-2 md:-left-14 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full shadow-md">
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <Button variant="outline" size="icon" onClick={nextSlide} className="absolute -right-2 md:-right-14 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full shadow-md">
            <ChevronRight className="h-5 w-5" />
          </Button>

          <div className="relative min-h-[320px] flex items-center justify-center px-6 md:px-12">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={current.id}
                custom={direction}
                initial={{ x: direction > 0 ? 200 : -200, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: direction > 0 ? -200 : 200, opacity: 0 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                className="absolute inset-x-4 md:inset-x-8 card-elevated p-8 md:p-10 rounded-2xl"
              >
                <Quote className="h-8 w-8 text-primary/20 mb-4" />
                <StarRating rating={current.rating} />
                <blockquote className="text-foreground text-base md:text-lg leading-relaxed my-6 italic">
                  "{current.quote}"
                </blockquote>
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12 border-2 border-primary/20">
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
                      {current.name.split(" ").map((n) => n[0]).join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold text-foreground text-sm">{current.name}</p>
                    <p className="text-xs text-muted-foreground">{current.role}</p>
                  </div>
                  <span className={`ml-auto px-3 py-1 rounded-full text-xs font-medium ${
                    current.type === "candidate" ? "bg-accent/20 text-accent-foreground" : "bg-primary/10 text-primary"
                  }`}>
                    {current.type === "candidate" ? "Faculty" : "Institution"}
                  </span>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="flex justify-center gap-2 mt-6">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => { setDirection(index > currentIndex ? 1 : -1); setCurrentIndex(index); }}
                className={`h-2 rounded-full transition-all duration-300 ${index === currentIndex ? "w-8 bg-primary" : "w-2 bg-muted-foreground/30"}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
