import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Quote, Star } from "lucide-react";
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
  rating: number;
}

const testimonials: Testimonial[] = [
  {
    id: 1,
    quote: "OWL ROLES helped me transition from a lecturer to an Associate Professor at IIT Delhi. The AI matching understood my research profile perfectly and connected me with the right opportunities!",
    name: "Dr. Priya Sharma",
    role: "Associate Professor, Computer Science",
    institution: "IIT Delhi",
    type: "candidate",
    rating: 5,
  },
  {
    id: 2,
    quote: "As the Dean of our engineering college, finding UGC-NET qualified faculty was always challenging. OWL ROLES streamlined our entire recruitment process and we hired 12 exceptional candidates in one semester.",
    name: "Prof. Rajesh Verma",
    role: "Dean of Engineering",
    institution: "NIT Trichy",
    type: "recruiter",
    rating: 5,
  },
  {
    id: 3,
    quote: "After completing my PhD from JNU, I was struggling to find the right academic position. Within 3 weeks of joining OWL ROLES, I received interview calls from 5 prestigious universities!",
    name: "Dr. Ananya Krishnan",
    role: "Assistant Professor, Economics",
    institution: "Delhi School of Economics",
    type: "candidate",
    rating: 5,
  },
  {
    id: 4,
    quote: "The platform's focus on Indian academia is remarkable. We could filter candidates by UGC-NET, GATE scores, and research publications. Highly recommended for all educational institutions.",
    name: "Dr. Suresh Nair",
    role: "Director",
    institution: "IIIT Hyderabad",
    type: "recruiter",
    rating: 4,
  },
  {
    id: 5,
    quote: "I was a visiting faculty for 8 years before OWL ROLES helped me secure a permanent position. The resume parser highlighted my publications perfectly and matched me with the ideal role.",
    name: "Dr. Meera Iyer",
    role: "Professor, Mathematics",
    institution: "Chennai Mathematical Institute",
    type: "candidate",
    rating: 5,
  },
  {
    id: 6,
    quote: "Our medical college needed specialized faculty across multiple departments. OWL ROLES provided us with a curated pool of MBBS/MD qualified educators. The interview scheduling feature saved us weeks of coordination.",
    name: "Dr. Arun Gupta",
    role: "Principal",
    institution: "AIIMS Bhopal",
    type: "recruiter",
    rating: 5,
  },
  {
    id: 7,
    quote: "Moving from industry to academia seemed impossible until I found OWL ROLES. They valued my 15 years of corporate experience and helped me land a Professor of Practice role at a top B-school.",
    name: "Prof. Vikram Singh",
    role: "Professor of Practice, Marketing",
    institution: "IIM Ahmedabad",
    type: "candidate",
    rating: 4,
  },
  {
    id: 8,
    quote: "We run a network of 25 colleges across South India. OWL ROLES has become our go-to platform for all faculty recruitment. The quality of candidates and the streamlined process is unmatched.",
    name: "Dr. Lakshmi Rao",
    role: "Vice Chancellor",
    institution: "VIT University",
    type: "recruiter",
    rating: 5,
  },
];

const StarRating = ({ rating }: { rating: number }) => {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`h-4 w-4 ${
            star <= rating
              ? "fill-amber-400 text-amber-400"
              : "fill-muted text-muted"
          }`}
        />
      ))}
    </div>
  );
};

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
            What Indian Educators Say
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Hear from faculty members and institutions across India who found success through OWL ROLES
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
          <div className="relative min-h-[360px] flex items-center justify-center px-8">
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

                {/* Badge & Rating */}
                <div className="flex justify-between items-center mb-4">
                  <StarRating rating={currentTestimonial.rating} />
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      currentTestimonial.type === "candidate"
                        ? "bg-accent/20 text-accent-foreground"
                        : "bg-primary/10 text-primary"
                    }`}
                  >
                    {currentTestimonial.type === "candidate" ? "Faculty" : "Institution"}
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
