import owlTeaching from "@/assets/owl-icons/owl-teaching.png";
import owlResearch from "@/assets/owl-icons/owl-research.png";
import owlCS from "@/assets/owl-icons/owl-cs.png";
import owlLiterature from "@/assets/owl-icons/owl-literature.png";
import owlAdmin from "@/assets/owl-icons/owl-admin.png";
import owlEngineering from "@/assets/owl-icons/owl-engineering.png";
import owlMedical from "@/assets/owl-icons/owl-medical.png";
import owlMath from "@/assets/owl-icons/owl-math.png";
import owlArts from "@/assets/owl-icons/owl-arts.png";
import owlLanguages from "@/assets/owl-icons/owl-languages.png";

interface Category {
  image: string;
  name: string;
  count: number;
}

const categories: Category[] = [
  { image: owlTeaching, name: "Teaching Faculty", count: 856 },
  { image: owlResearch, name: "Research", count: 432 },
  { image: owlCS, name: "Computer Science", count: 324 },
  { image: owlLiterature, name: "Literature", count: 198 },
  { image: owlAdmin, name: "Administration", count: 167 },
  { image: owlEngineering, name: "Engineering", count: 543 },
  { image: owlMedical, name: "Medical", count: 287 },
  { image: owlMath, name: "Mathematics", count: 156 },
  { image: owlArts, name: "Arts & Design", count: 98 },
  { image: owlLanguages, name: "Languages", count: 134 },
];

interface JobCategoriesProps {
  onCategoryClick: (category: string) => void;
}

const JobCategories = ({ onCategoryClick }: JobCategoriesProps) => {
  return (
    <section className="py-12 pb-6">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="font-heading text-2xl md:text-4xl font-extrabold text-foreground mb-3 tracking-tight">
            Browse Higher Education Careers by Field
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Choose your field and see what's hiring across Indian universities right now.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {categories.map((category) => (
            <button
              key={category.name}
              onClick={() => onCategoryClick(category.name)}
              className="card-elevated p-5 text-center group cursor-pointer transition-all hover:-translate-y-1"
            >
              <div className="w-20 h-20 mx-auto mb-3 flex items-center justify-center">
                <img
                  src={category.image}
                  alt={`${category.name} owl mascot`}
                  width={512}
                  height={512}
                  loading="lazy"
                  className="w-full h-full object-contain transition-transform group-hover:scale-110"
                />
              </div>
              <h3 className="font-heading font-semibold text-sm text-foreground group-hover:text-primary transition-colors mb-1">
                {category.name}
              </h3>
              <span className="text-xs text-muted-foreground">
                {category.count} jobs
              </span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};

export default JobCategories;
