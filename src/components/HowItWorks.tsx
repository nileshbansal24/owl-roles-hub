import { motion } from "framer-motion";
import { UserPlus, Search, Cpu, Rocket } from "lucide-react";

const steps = [
  {
    icon: UserPlus,
    title: "Create Profile",
    description: "Sign up and build your academic profile with publications, research, and experience.",
    color: "text-primary",
    bg: "bg-primary/10",
    ring: "ring-primary/20",
    glow: "group-hover:shadow-primary/20",
  },
  {
    icon: Search,
    title: "Discover Jobs",
    description: "Browse curated positions from 500+ universities matched to your expertise.",
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-500/10",
    ring: "ring-emerald-500/20",
    glow: "group-hover:shadow-emerald-500/20",
  },
  {
    icon: Cpu,
    title: "AI Matching",
    description: "Our AI analyzes your profile and recommends the best-fit opportunities automatically.",
    color: "text-violet-600 dark:text-violet-400",
    bg: "bg-violet-500/10",
    ring: "ring-violet-500/20",
    glow: "group-hover:shadow-violet-500/20",
  },
  {
    icon: Rocket,
    title: "Get Hired",
    description: "Apply with one click, schedule interviews, and land your dream academic role.",
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-500/10",
    ring: "ring-amber-500/20",
    glow: "group-hover:shadow-amber-500/20",
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
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-4">
            Simple Process
          </span>
          <h2 className="font-heading text-2xl md:text-4xl font-extrabold text-foreground mb-3 tracking-tight">
            How It Works
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto font-medium">
            From sign-up to your dream academic position in four simple steps
          </p>
        </motion.div>

        <div className="relative max-w-4xl mx-auto">
          {/* Animated connecting line */}
          <motion.div
            className="hidden md:block absolute top-16 left-[12.5%] right-[12.5%] h-0.5 bg-gradient-to-r from-primary/10 via-primary/30 to-primary/10"
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
          />

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-6">
            {steps.map((step, index) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.15, type: "spring", stiffness: 100, damping: 12 }}
                className={`text-center relative group`}
              >
                <motion.div
                  className="relative mx-auto mb-5"
                  whileHover={{ scale: 1.12, rotate: 4 }}
                  transition={{ type: "spring", stiffness: 400, damping: 15 }}
                >
                  <div className={`w-16 h-16 mx-auto rounded-2xl ${step.bg} ring-2 ${step.ring} flex items-center justify-center relative z-10 shadow-lg ${step.glow} transition-shadow duration-300`}>
                    <step.icon className={`w-7 h-7 ${step.color}`} />
                  </div>
                  <motion.div
                    className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center z-20 shadow-md"
                    initial={{ scale: 0 }}
                    whileInView={{ scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.4 + index * 0.15, type: "spring", stiffness: 500 }}
                  >
                    {index + 1}
                  </motion.div>
                </motion.div>

                <h3 className="font-heading font-bold text-foreground mb-2 text-lg tracking-tight">
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
