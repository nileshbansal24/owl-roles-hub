import { useState, useEffect, useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Briefcase, Users, Building2, Award } from "lucide-react";

const useCountUp = (end: number, duration: number = 2000, shouldStart: boolean = false) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!shouldStart) return;
    let startTime: number;
    let animationFrame: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setCount(Math.floor(eased * end));
      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [end, duration, shouldStart]);

  return count;
};

const stats = [
  { icon: Briefcase, value: 2500, suffix: "+", label: "Active Jobs", gradient: "from-primary/20 to-primary/5" },
  { icon: Users, value: 50000, suffix: "+", label: "Registered Candidates", gradient: "from-emerald-500/20 to-emerald-500/5" },
  { icon: Building2, value: 500, suffix: "+", label: "Universities", gradient: "from-violet-500/20 to-violet-500/5" },
  { icon: Award, value: 1200, suffix: "+", label: "Placements/Month", gradient: "from-amber-500/20 to-amber-500/5" },
];

const iconColors = [
  "text-primary",
  "text-emerald-600 dark:text-emerald-400",
  "text-violet-600 dark:text-violet-400",
  "text-amber-600 dark:text-amber-400",
];

const StatsSection = () => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <section className="py-16 relative overflow-hidden">
      {/* Subtle background */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.03] via-transparent to-primary/[0.03]" />
      
      <div className="container mx-auto px-4 relative" ref={ref}>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 30, scale: 0.9 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, type: "spring", stiffness: 100 }}
              whileHover={{ y: -6, scale: 1.02 }}
              className="relative group"
            >
              <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${stat.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
              <div className="relative card-elevated p-6 text-center rounded-2xl">
                <motion.div
                  className="w-14 h-14 mx-auto mb-4 rounded-xl bg-gradient-to-br from-background to-secondary flex items-center justify-center border border-border"
                  whileHover={{ rotate: 10, scale: 1.1 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <stat.icon className={`w-7 h-7 ${iconColors[index]}`} />
                </motion.div>
                <CountUpNumber value={stat.value} suffix={stat.suffix} shouldStart={isInView} />
                <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

const CountUpNumber = ({ value, suffix, shouldStart }: { value: number; suffix: string; shouldStart: boolean }) => {
  const count = useCountUp(value, 2000, shouldStart);
  return (
    <p className="font-heading text-3xl md:text-4xl font-bold text-foreground tabular-nums">
      {count.toLocaleString()}{suffix}
    </p>
  );
};

export default StatsSection;
