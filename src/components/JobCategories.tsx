import { motion } from "framer-motion";
import { 
  GraduationCap, Microscope, Code, BookOpen, Users, Building2,
  Stethoscope, Calculator, Palette, Globe
} from "lucide-react";

interface Category {
  icon: React.ElementType;
  name: string;
  count: number;
  gradient: string;
  iconColor: string;
}

const categories: Category[] = [
  { icon: GraduationCap, name: "Teaching Faculty", count: 856, gradient: "from-primary/15 to-primary/5", iconColor: "text-primary" },
  { icon: Microscope, name: "Research", count: 432, gradient: "from-violet-500/15 to-violet-500/5", iconColor: "text-violet-600 dark:text-violet-400" },
  { icon: Code, name: "Computer Science", count: 324, gradient: "from-emerald-500/15 to-emerald-500/5", iconColor: "text-emerald-600 dark:text-emerald-400" },
  { icon: BookOpen, name: "Literature", count: 198, gradient: "from-amber-500/15 to-amber-500/5", iconColor: "text-amber-600 dark:text-amber-400" },
  { icon: Users, name: "Administration", count: 167, gradient: "from-pink-500/15 to-pink-500/5", iconColor: "text-pink-600 dark:text-pink-400" },
  { icon: Building2, name: "Engineering", count: 543, gradient: "from-orange-500/15 to-orange-500/5", iconColor: "text-orange-600 dark:text-orange-400" },
  { icon: Stethoscope, name: "Medical", count: 287, gradient: "from-red-500/15 to-red-500/5", iconColor: "text-red-600 dark:text-red-400" },
  { icon: Calculator, name: "Mathematics", count: 156, gradient: "from-indigo-500/15 to-indigo-500/5", iconColor: "text-indigo-600 dark:text-indigo-400" },
  { icon: Palette, name: "Arts & Design", count: 98, gradient: "from-teal-500/15 to-teal-500/5", iconColor: "text-teal-600 dark:text-teal-400" },
  { icon: Globe, name: "Languages", count: 134, gradient: "from-cyan-500/15 to-cyan-500/5", iconColor: "text-cyan-600 dark:text-cyan-400" },
];

interface JobCategoriesProps {
  onCategoryClick: (category: string) => void;
}

const JobCategories = ({ onCategoryClick }: JobCategoriesProps) => {
  return (
    <section className="py-16 bg-secondary/30 overflow-hidden">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10"
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            Browse Categories
          </span>
          <h2 className="font-heading text-2xl md:text-3xl font-bold text-foreground mb-2">
            Explore by Category
          </h2>
          <p className="text-muted-foreground">
            Find opportunities in your field of expertise
          </p>
        </motion.div>

        {/* Marquee Row 1 */}
        <div className="relative mb-4">
          <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-secondary/80 to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-secondary/80 to-transparent z-10 pointer-events-none" />
          <motion.div
            className="flex gap-4"
            animate={{ x: ["0%", "-50%"] }}
            transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
          >
            {[...categories.slice(0, 5), ...categories.slice(0, 5)].map((category, index) => (
              <CategoryCard
                key={`row1-${index}`}
                category={category}
                onClick={() => onCategoryClick(category.name)}
              />
            ))}
          </motion.div>
        </div>

        {/* Marquee Row 2 - reverse direction */}
        <div className="relative">
          <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-secondary/80 to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-secondary/80 to-transparent z-10 pointer-events-none" />
          <motion.div
            className="flex gap-4"
            animate={{ x: ["-50%", "0%"] }}
            transition={{ duration: 35, repeat: Infinity, ease: "linear" }}
          >
            {[...categories.slice(5), ...categories.slice(5)].map((category, index) => (
              <CategoryCard
                key={`row2-${index}`}
                category={category}
                onClick={() => onCategoryClick(category.name)}
              />
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
};

const CategoryCard = ({ category, onClick }: { category: Category; onClick: () => void }) => (
  <motion.button
    whileHover={{ y: -4, scale: 1.03 }}
    whileTap={{ scale: 0.97 }}
    onClick={onClick}
    className="flex items-center gap-4 px-6 py-4 rounded-xl bg-card border border-border hover:border-primary/50 hover:shadow-lg transition-all group min-w-[260px] shrink-0"
  >
    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${category.gradient} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}>
      <category.icon className={`w-6 h-6 ${category.iconColor}`} />
    </div>
    <div className="text-left">
      <h3 className="font-heading font-semibold text-sm text-foreground group-hover:text-primary transition-colors">
        {category.name}
      </h3>
      <span className="text-xs text-muted-foreground">
        {category.count} jobs
      </span>
    </div>
  </motion.button>
);

export default JobCategories;
