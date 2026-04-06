import { useState, useEffect, useRef } from "react";
import { useInView } from "framer-motion";
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
  { icon: Briefcase, value: 2500, suffix: "+", label: "Active Jobs", iconBg: "bg-primary/10", iconColor: "text-primary" },
  { icon: Users, value: 50000, suffix: "+", label: "Registered Job Seekers", iconBg: "bg-emerald-500/10", iconColor: "text-emerald-600 dark:text-emerald-400" },
  { icon: Building2, value: 500, suffix: "+", label: "Universities", iconBg: "bg-violet-500/10", iconColor: "text-violet-600 dark:text-violet-400" },
  { icon: Award, value: 1200, suffix: "+", label: "Placements/Month", iconBg: "bg-amber-500/10", iconColor: "text-amber-600 dark:text-amber-400" },
];

const StatsSection = () => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <section className="py-16 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.02] via-transparent to-primary/[0.02]" />

      <div className="container mx-auto px-4 relative" ref={ref}>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {stats.map((stat) => (
            <div key={stat.label} className="relative">
              <div className="card-elevated p-6 text-center rounded-2xl">
                <div className={`w-14 h-14 mx-auto mb-4 rounded-xl ${stat.iconBg} flex items-center justify-center border border-border/50`}>
                  <stat.icon className={`w-7 h-7 ${stat.iconColor}`} />
                </div>
                <CountUpNumber value={stat.value} suffix={stat.suffix} shouldStart={isInView} />
                <p className="text-sm text-muted-foreground mt-1 font-medium">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const CountUpNumber = ({ value, suffix, shouldStart }: { value: number; suffix: string; shouldStart: boolean }) => {
  const count = useCountUp(value, 2200, shouldStart);
  return (
    <p className="font-heading text-3xl md:text-4xl font-extrabold text-foreground tabular-nums">
      {count.toLocaleString()}{suffix}
    </p>
  );
};

export default StatsSection;
