import { motion } from "framer-motion";

const universities = [
  { name: "LPU", fullName: "Lovely Professional University" },
  { name: "CU", fullName: "Chandigarh University" },
  { name: "Chitkara", fullName: "Chitkara University" },
  { name: "Amity", fullName: "Amity University" },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.9 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring" as const,
      stiffness: 100,
      damping: 12,
    },
  },
};

const UniversityPartners = () => {
  return (
    <section className="py-16 bg-secondary/30">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10"
        >
          <h2 className="font-heading text-2xl md:text-3xl font-bold text-foreground mb-3">
            Partnered with Leading Universities
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            We collaborate with India's top institutions to bring you the best academic opportunities
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-2 md:grid-cols-4 gap-6"
        >
          {universities.map((uni) => (
            <motion.div
              key={uni.name}
              variants={itemVariants}
              whileHover={{ 
                scale: 1.05, 
                boxShadow: "0 20px 40px -15px hsl(var(--primary) / 0.2)" 
              }}
              className="card-elevated p-6 text-center cursor-pointer group"
            >
              <motion.div
                className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center"
                whileHover={{ rotate: 5 }}
              >
                <span className="font-heading font-bold text-xl text-primary">
                  {uni.name.slice(0, 2).toUpperCase()}
                </span>
              </motion.div>
              <h3 className="font-heading font-semibold text-foreground group-hover:text-primary transition-colors">
                {uni.name}
              </h3>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                {uni.fullName}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default UniversityPartners;
