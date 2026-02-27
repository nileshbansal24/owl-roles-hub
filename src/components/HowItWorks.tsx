import { motion } from "framer-motion";
import { Upload, Search, Sparkles, CheckCircle2 } from "lucide-react";

const steps = [
  {
    icon: Upload,
    title: "Create Profile",
    description: "Sign up and build your academic profile with publications, research, and experience.",
    color: "text-primary",
    bg: "bg-primary/10",
    ring: "ring-primary/20",
  },
  {
    icon: Search,
    title: "Discover Jobs",
    description: "Browse curated positions from 500+ universities matched to your expertise.",
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-500/10",
    ring: "ring-emerald-500/20",
  },
  {
    icon: Sparkles,
    title: "AI Matching",
    description: "Our AI analyzes your profile and recommends the best-fit opportunities automatically.",
    color: "text-violet-600 dark:text-violet-400",
    bg: "bg-violet-500/10",
    ring: "ring-violet-500/20",
  },
  {
    icon: CheckCircle2,
    title: "Get Hired",
    description: "Apply with one click, schedule interviews, and land your dream academic role.",
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-500/10",
    ring: "ring-amber-500/20",
  },
];

const HowItWorks = () => {
  return (
    <section className="py-20 relative overflow-hidden">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            Simple Process
          </span>
          <h2 className="font-heading text-2xl md:text-3xl font-bold text-foreground mb-3">
            How It Works
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            From sign-up to your dream academic position in four simple steps
          </p>
        </motion.div>

        <div className="relative max-w-4xl mx-auto">
          {/* Connecting line */}
          <div className="hidden md:block absolute top-16 left-[12.5%] right-[12.5%] h-0.5 bg-gradient-to-r from-primary/20 via-primary/40 to-primary/20" />
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-6">
            {steps.map((step, index) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.15, type: "spring", stiffness: 100 }}
                className="text-center relative group"
              >
                {/* Step number */}
                <motion.div
                  className="relative mx-auto mb-5"
                  whileHover={{ scale: 1.1 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <div className={`w-16 h-16 mx-auto rounded-2xl ${step.bg} ring-2 ${step.ring} flex items-center justify-center relative z-10 group-hover:shadow-lg transition-shadow`}>
                    <step.icon className={`w-7 h-7 ${step.color}`} />
                  </div>
                  <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center z-20 shadow-md">
                    {index + 1}
                  </div>
                </motion.div>

                <h3 className="font-heading font-bold text-foreground mb-2 text-lg">
                  {step.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {step.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
