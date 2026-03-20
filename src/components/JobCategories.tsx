import { motion } from "framer-motion";
import { 
  GraduationCap, Microscope, Code, BookOpen, Users, Building2,
  Stethoscope, Calculator, Palette, Globe
} from "lucide-react";

interface Category {
  icon: React.ElementType;
  name: string;
  count: number;
  color: string;
}

const categories: Category[] = [
  { icon: GraduationCap, name: "Teaching Faculty", count: 856, color: "text-primary" },
  { icon: Microscope, name: "Research", count: 432, color: "text-violet-600 dark:text-violet-400" },
  { icon: Code, name: "Computer Science", count: 324, color: "text-emerald-600 dark:text-emerald-400" },
  { icon: BookOpen, name: "Literature", count: 198, color: "text-amber-600 dark:text-amber-400" },
  { icon: Users, name: "Administration", count: 167, color: "text-pink-600 dark:text-pink-400" },
  { icon: Building2, name: "Engineering", count: 543, color: "text-orange-600 dark:text-orange-400" },
  { icon: Stethoscope, name: "Medical", count: 287, color: "text-red-600 dark:text-red-400" },
  { icon: Calculator, name: "Mathematics", count: 156, color: "text-indigo-600 dark:text-indigo-400" },
  { icon: Palette, name: "Arts & Design", count: 98, color: "text-teal-600 dark:text-teal-400" },
  { icon: Globe, name: "Languages", count: 134, color: "text-cyan-600 dark:text-cyan-400" },
];

interface JobCategoriesProps {
  onCategoryClick: (category: string) => void;
}

const JobCategories = ({ onCategoryClick }: JobCategoriesProps) => {
  return (
    <section className="py-12 pb-6">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="font-heading text-2xl md:text-4xl font-extrabold text-foreground mb-3 tracking-tight">
            Popular Job Categories
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Find opportunities in your field of expertise
          </p>
        </motion.div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {categories.map((category, index) => (
            <motion.button
              key={category.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ y: -6, scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => onCategoryClick(category.name)}
              className="card-elevated p-5 text-center group cursor-pointer"
            >
              <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-secondary flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                <category.icon className={`w-6 h-6 ${category.color} group-hover:scale-110 transition-transform`} />
              </div>
              <h3 className="font-heading font-semibold text-sm text-foreground group-hover:text-primary transition-colors mb-1">
                {category.name}
              </h3>
              <span className="text-xs text-muted-foreground">
                {category.count} jobs
              </span>
            </motion.button>
          ))}
        </div>
      </div>
    </section>
  );
};

export default JobCategories;
