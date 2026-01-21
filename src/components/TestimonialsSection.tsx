import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Quote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Testimonial {
  id: number;
  quote: string;
  name: string;
  role: string;
  institution: string;
  avatar?: string;
  type: "candidate" | "recruiter";
}

const testimonials: Testimonial[] = [
  {
    id: 1,
    quote: "OWL ROLES transformed my academic job search. Within weeks, I landed my dream position as an Assistant Professor at a top-tier university. The AI matching was incredibly accurate!",
    name: "Dr. Sarah Chen",
    role: "Assistant Professor of Biology",
    institution: "Stanford University",
    type: "candidate",
  },
  {
    id: 2,
    quote: "As a department head, finding qualified candidates used to take months. With OWL ROLES, we filled three faculty positions in under 6 weeks with exceptional talent.",
    name: "Prof. Michael Rodriguez",
    role: "Department Chair",
    institution: "MIT",
    type: "recruiter",
  },
  {
    id: 3,
    quote: "The platform's focus on academia made all the difference. I could highlight my research publications and teaching philosophy, which helped me stand out to recruiters.",
    name: "Dr. Emily Watson",
    role: "Research Associate",
    institution: "Oxford University",
    type: "candidate",
  },
  {
    id: 4,
    quote: "We've partnered with OWL ROLES for all our academic hiring. The quality of candidates and the streamlined interview scheduling has revolutionized our recruitment process.",
    name: "Dr. James Park",
    role: "Dean of Sciences",
    institution: "Harvard University",
    type: "recruiter",
  },
  {
    id: 5,
    quote: "After years of struggling to find the right fit, OWL ROLES connected me with institutions that truly valued my interdisciplinary research. I couldn't be happier!",
    name: "Dr. Priya Sharma",
    role: "Associate Professor",
    institution: "Yale University",
    type: "candidate",
  },
];

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

  // Auto-advance carousel
  useEffect(() => {
    const timer = setInterval(nextSlide, 6000);
    return () => clearInterval(timer);
  }, [nextSlide]);

  const currentTestimonial = testimonials[currentIndex];

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0,
      scale: 0.95,
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.4,
        ease: "easeOut" as const,
      },
    },
    exit: (direction: number) => ({
      x: direction > 0 ? -300 : 300,
      opacity: 0,
      scale: 0.95,
      transition: {
        duration: 0.3,
        ease: "easeIn" as const,
      },
    }),
  };

  return (
    <section className="py-20 bg-secondary/30 overflow-hidden">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            Success Stories
          </span>
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-4">
            What Our Community Says
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Hear from candidates and recruiters who found success through OWL ROLES
          </p>
        </motion.div>

        {/* Testimonial Carousel */}
        <div className="relative max-w-4xl mx-auto">
          {/* Navigation Buttons */}
          <Button
            variant="outline"
            size="icon"
            onClick={prevSlide}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 md:-translate-x-12 z-10 h-10 w-10 rounded-full bg-background shadow-lg border-border hover:bg-primary hover:text-primary-foreground transition-all"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={nextSlide}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 md:translate-x-12 z-10 h-10 w-10 rounded-full bg-background shadow-lg border-border hover:bg-primary hover:text-primary-foreground transition-all"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>

          {/* Testimonial Card */}
          <div className="relative min-h-[320px] flex items-center justify-center px-8">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={currentTestimonial.id}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                className="absolute inset-x-8 bg-card rounded-2xl p-8 md:p-10 shadow-xl border border-border"
              >
                {/* Quote Icon */}
                <div className="absolute -top-5 left-8 w-10 h-10 rounded-full bg-primary flex items-center justify-center shadow-lg">
                  <Quote className="h-5 w-5 text-primary-foreground" />
                </div>

                {/* Badge */}
                <div className="flex justify-end mb-4">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      currentTestimonial.type === "candidate"
                        ? "bg-accent/20 text-accent-foreground"
                        : "bg-primary/10 text-primary"
                    }`}
                  >
                    {currentTestimonial.type === "candidate" ? "Candidate" : "Recruiter"}
                  </span>
                </div>

                {/* Quote */}
                <blockquote className="text-foreground text-lg md:text-xl leading-relaxed mb-8 italic">
                  "{currentTestimonial.quote}"
                </blockquote>

                {/* Author */}
                <div className="flex items-center gap-4">
                  <Avatar className="h-14 w-14 border-2 border-primary/20">
                    <AvatarImage src={currentTestimonial.avatar} />
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                      {currentTestimonial.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold text-foreground">{currentTestimonial.name}</p>
                    <p className="text-sm text-muted-foreground">{currentTestimonial.role}</p>
                    <p className="text-sm text-primary font-medium">{currentTestimonial.institution}</p>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Dots Indicator */}
          <div className="flex justify-center gap-2 mt-8">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => {
                  setDirection(index > currentIndex ? 1 : -1);
                  setCurrentIndex(index);
                }}
                className={`h-2 rounded-full transition-all duration-300 ${
                  index === currentIndex
                    ? "w-8 bg-primary"
                    : "w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
