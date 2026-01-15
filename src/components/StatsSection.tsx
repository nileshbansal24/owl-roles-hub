import { motion } from "framer-motion";
import { Briefcase, Users, Building2, Award } from "lucide-react";

const stats = [
  { icon: Briefcase, value: "2,500+", label: "Active Jobs", color: "bg-blue-500/10 text-blue-600" },
  { icon: Users, value: "50,000+", label: "Registered Candidates", color: "bg-green-500/10 text-green-600" },
  { icon: Building2, value: "500+", label: "Universities", color: "bg-purple-500/10 text-purple-600" },
  { icon: Award, value: "1,200+", label: "Placements/Month", color: "bg-orange-500/10 text-orange-600" },
];

const StatsSection = () => {
  return (
    <section className="py-12 bg-primary/5">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center gap-4"
            >
              <div className={`w-14 h-14 rounded-xl ${stat.color} flex items-center justify-center shrink-0`}>
                <stat.icon className="w-7 h-7" />
              </div>
              <div>
                <p className="font-heading text-2xl md:text-3xl font-bold text-foreground">
                  {stat.value}
                </p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StatsSection;
