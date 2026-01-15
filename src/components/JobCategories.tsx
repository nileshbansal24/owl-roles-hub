import { motion } from "framer-motion";
import { 
  GraduationCap, 
  Microscope, 
  Code, 
  BookOpen, 
  Users, 
  Building2,
  Stethoscope,
  Calculator,
  Palette,
  Globe
} from "lucide-react";

interface Category {
  icon: React.ElementType;
  name: string;
  count: number;
  color: string;
}

const categories: Category[] = [
  { icon: GraduationCap, name: "Teaching Faculty", count: 856, color: "bg-blue-500/10 text-blue-600" },
  { icon: Microscope, name: "Research", count: 432, color: "bg-purple-500/10 text-purple-600" },
  { icon: Code, name: "Computer Science", count: 324, color: "bg-green-500/10 text-green-600" },
  { icon: BookOpen, name: "Literature", count: 198, color: "bg-yellow-500/10 text-yellow-600" },
  { icon: Users, name: "Administration", count: 167, color: "bg-pink-500/10 text-pink-600" },
  { icon: Building2, name: "Engineering", count: 543, color: "bg-orange-500/10 text-orange-600" },
  { icon: Stethoscope, name: "Medical", count: 287, color: "bg-red-500/10 text-red-600" },
  { icon: Calculator, name: "Mathematics", count: 156, color: "bg-indigo-500/10 text-indigo-600" },
  { icon: Palette, name: "Arts & Design", count: 98, color: "bg-teal-500/10 text-teal-600" },
  { icon: Globe, name: "Languages", count: 134, color: "bg-cyan-500/10 text-cyan-600" },
];

interface JobCategoriesProps {
  onCategoryClick: (category: string) => void;
}

const JobCategories = ({ onCategoryClick }: JobCategoriesProps) => {
  return (
    <section className="py-16 bg-secondary/30">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10"
        >
          <h2 className="font-heading text-2xl md:text-3xl font-bold text-foreground mb-2">
            Explore by Category
          </h2>
          <p className="text-muted-foreground">
            Find opportunities in your field of expertise
          </p>
        </motion.div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {categories.map((category, index) => (
            <motion.button
              key={category.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ y: -4, scale: 1.02 }}
              onClick={() => onCategoryClick(category.name)}
              className="flex flex-col items-center p-5 rounded-xl bg-card border border-border hover:border-primary/50 hover:shadow-lg transition-all group"
            >
              <div className={`w-14 h-14 rounded-xl ${category.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                <category.icon className="w-7 h-7" />
              </div>
              <h3 className="font-heading font-semibold text-sm text-foreground text-center">
                {category.name}
              </h3>
              <span className="text-xs text-muted-foreground mt-1">
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
