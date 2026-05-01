import { Search, FileText, CheckCircle } from "lucide-react";

const steps = [
  {
    icon: Search,
    title: "Search That Speaks Academic",
    description:
      "Filter by department, NET/SET, publications and more — built for how higher education actually hires.",
  },
  {
    icon: FileText,
    title: "Apply in One Click",
    description:
      "Your profile travels with you. Send applications to multiple universities without retyping a thing.",
  },
  {
    icon: CheckCircle,
    title: "Get Hired, Stress Less",
    description:
      "Hear back faster, schedule interviews in-app, and start the next chapter of your academic career.",
  },
];

const HowItWorks = () => {
  return (
    <section className="py-16 md:py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12 md:mb-14">
          <span className="inline-block text-xs font-semibold uppercase tracking-wider text-primary mb-3">
            Getting Started
          </span>
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-3 tracking-tight">
            How OWL ROLES Works
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Three simple steps from "I'm looking" to "I got the offer."
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
