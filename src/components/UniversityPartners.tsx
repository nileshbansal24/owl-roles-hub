const universities = [
  { name: "LPU", fullName: "Lovely Professional University" },
  { name: "CU", fullName: "Chandigarh University" },
  { name: "Chitkara", fullName: "Chitkara University" },
  { name: "Amity", fullName: "Amity University" },
];

const UniversityPartners = () => {
  return (
    <section className="py-16 bg-secondary/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10">
          <h2 className="font-heading text-2xl md:text-3xl font-bold text-foreground mb-3">
            Partnered with Leading Universities
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            We collaborate with India's top institutions to bring you the best academic opportunities
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {universities.map((uni) => (
            <div
              key={uni.name}
              className="card-elevated p-6 text-center cursor-pointer group transition-shadow"
            >
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="font-heading font-bold text-xl text-primary">
                  {uni.name.slice(0, 2).toUpperCase()}
                </span>
              </div>
              <h3 className="font-heading font-semibold text-foreground group-hover:text-primary transition-colors">
                {uni.name}
              </h3>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                {uni.fullName}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default UniversityPartners;
