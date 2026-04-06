import { Search, FileText, CheckCircle } from "lucide-react";

const steps = [
  {
    icon: Search,
    step: "01",
    title: "Search Jobs",
    description: "Browse thousands of academic positions from top universities matching your expertise.",
  },
  {
    icon: FileText,
    step: "02",
    title: "Apply Online",
    description: "Submit your application with one click. Our AI optimizes your profile for each role.",
  },
  {
    icon: CheckCircle,
    step: "03",
    title: "Get Hired",
    description: "Connect with institutions, schedule interviews, and land your dream academic position.",
  },
];

const HowItWorks = () => {
  return (
    <section className="py-10 bg-secondary/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h2 className="font-heading text-2xl md:text-4xl font-extrabold text-foreground mb-3 tracking-tight">
            How It Works
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Three simple steps to your next academic career move
          </p>
        </div>

        <div className="relative max-w-4xl mx-auto">
          <div className="hidden md:block absolute top-16 left-[16%] right-[16%] h-px bg-border" />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-8">
            {steps.map((step, index) => (
              <div key={step.title} className="text-center relative">
                <div className="relative mx-auto mb-6 w-16 h-16">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center relative z-10">
                    <step.icon className="w-7 h-7 text-primary" />
                  </div>
                  <span className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center z-20 shadow-md">
                    {index + 1}
                  </span>
                </div>

                <h3 className="font-heading font-bold text-foreground mb-2 text-lg">
                  {step.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
