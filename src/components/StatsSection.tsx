import { useState, useEffect, useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Briefcase, Users, Building2, Award, TrendingUp, GraduationCap } from "lucide-react";

const useCountUp = (end: number, duration: number = 2000, shouldStart: boolean = false) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!shouldStart) return;
    let startTime: number;
    let animationFrame: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
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
  { icon: Briefcase, value: 2500, suffix: "+", label: "Active Jobs", gradient: "from-primary/15 to-primary/5", iconBg: "bg-primary/10", iconColor: "text-primary" },
  { icon: Users, value: 50000, suffix: "+", label: "Registered Candidates", gradient: "from-emerald-500/15 to-emerald-500/5", iconBg: "bg-emerald-500/10", iconColor: "text-emerald-600 dark:text-emerald-400" },
  { icon: Building2, value: 500, suffix: "+", label: "Universities", gradient: "from-violet-500/15 to-violet-500/5", iconBg: "bg-violet-500/10", iconColor: "text-violet-600 dark:text-violet-400" },
  { icon: Award, value: 1200, suffix: "+", label: "Placements/Month", gradient: "from-amber-500/15 to-amber-500/5", iconBg: "bg-amber-500/10", iconColor: "text-amber-600 dark:text-amber-400" },
];

const StatsSection = () => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <section className="py-16 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.02] via-transparent to-primary/[0.02]" />

      <div className="container mx-auto px-4 relative" ref={ref}>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 30, scale: 0.9 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.12, type: "spring", stiffness: 120, damping: 14 }}
              className="relative group"
            >
              <motion.div
                whileHover={{ y: -8, scale: 1.03 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="relative"
              >
                <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${stat.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                <div className="relative card-elevated p-6 text-center rounded-2xl">
                  <motion.div
                    className={`w-14 h-14 mx-auto mb-4 rounded-xl ${stat.iconBg} flex items-center justify-center border border-border/50`}
                    whileHover={{ rotate: 8, scale: 1.15 }}
                    transition={{ type: "spring", stiffness: 400 }}
                  >
                    <stat.icon className={`w-7 h-7 ${stat.iconColor}`} />
                  </motion.div>
                  <CountUpNumber value={stat.value} suffix={stat.suffix} shouldStart={isInView} />
                  <p className="text-sm text-muted-foreground mt-1 font-medium">{stat.label}</p>
                </div>
              </motion.div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

const CountUpNumber = ({ value, suffix, shouldStart }: { value: number; suffix: string; shouldStart: boolean }) => {
  const count = useCountUp(value, 2200, shouldStart);
  return (
    <motion.p
      className="font-heading text-3xl md:text-4xl font-extrabold text-foreground tabular-nums"
      initial={{ scale: 0.8 }}
      whileInView={{ scale: 1 }}
      viewport={{ once: true }}
      transition={{ type: "spring", stiffness: 200 }}
    >
      {count.toLocaleString()}{suffix}
    </motion.p>
  );
};

export default StatsSection;
