import { Search, FileText, CheckCircle } from "lucide-react";

const steps = [
  {
    icon: Search,
    title: "Search Jobs",
    description:
      "Browse thousands of academic positions from top universities matching your expertise.",
  },
  {
    icon: FileText,
    title: "Apply Online",
    description:
      "Submit your application with one click. Our AI optimizes your profile for each role.",
  },
  {
    icon: CheckCircle,
    title: "Get Hired",
    description:
      "Connect with institutions, schedule interviews, and land your dream academic position.",
  },
];

const HowItWorks = () => {
  return (
    <section className="py-16 md:py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12 md:mb-14">
          <span className="inline-block text-xs font-semibold uppercase tracking-wider text-primary mb-3">
            Get Started
          </span>
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-3 tracking-tight">
            How It Works
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Three simple steps to your next academic career move
          </p>
        </div>

        <div className="relative max-w-5xl mx-auto">
          {/* Subtle dotted connector on desktop */}
          <div
            className="hidden md:block absolute top-9 left-[16%] right-[16%] h-px"
            style={{
              backgroundImage:
                "linear-gradient(to right, hsl(var(--border)) 50%, transparent 50%)",
              backgroundSize: "10px 1px",
              backgroundRepeat: "repeat-x",
            }}
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-8 relative">
            {steps.map((step, index) => (
              <div key={step.title} className="text-center relative">
                <div className="relative mx-auto mb-6 w-[72px] h-[72px]">
                  <div className="w-[72px] h-[72px] rounded-2xl bg-gradient-to-br from-primary/15 to-primary/5 border border-primary/10 flex items-center justify-center relative z-10 backdrop-blur-sm">
                    <step.icon className="w-7 h-7 text-primary" strokeWidth={2} />
                  </div>
                  <span className="absolute -top-1.5 -right-1.5 w-7 h-7 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center z-20 shadow-md ring-4 ring-background">
                    {index + 1}
                  </span>
                </div>

                <h3 className="font-heading font-semibold text-foreground mb-2 text-lg tracking-tight">
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
