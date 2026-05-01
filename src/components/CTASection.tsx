import { Button } from "@/components/ui/button";
import { Upload, Briefcase, ArrowRight } from "lucide-react";

interface CTASectionProps {
  onCandidateClick: () => void;
  onRecruiterClick: () => void;
}

const CTASection = ({ onCandidateClick, onRecruiterClick }: CTASectionProps) => {
  return (
    <section className="py-12 bg-primary relative overflow-hidden">
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
          backgroundSize: '32px 32px',
        }} />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-12">
          <h2 className="font-heading text-3xl md:text-4xl font-extrabold text-primary-foreground mb-3 tracking-tight">
            Let's Move Your Academic Career Forward
          </h2>
          <p className="text-primary-foreground/70 max-w-xl mx-auto">
            Whether you're hiring brilliant minds or chasing your next role — OWL ROLES is built for higher education in India.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          <div className="bg-primary-foreground/10 backdrop-blur-sm rounded-2xl p-8 border border-primary-foreground/20">
            <Upload className="w-8 h-8 text-primary-foreground mb-4" />
            <h3 className="font-heading text-xl font-bold text-primary-foreground mb-2">
              For Educators & Researchers
            </h3>
            <p className="text-primary-foreground/70 mb-6 text-sm leading-relaxed">
              Upload your CV once and let universities come to you. Personalised faculty and research roles, no spam.
            </p>
            <Button
              onClick={onCandidateClick}
              variant="secondary"
              className="w-full gap-2 bg-primary-foreground text-primary hover:bg-primary-foreground/90 font-semibold"
            >
              Create Your Profile
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>

          <div className="bg-primary-foreground/10 backdrop-blur-sm rounded-2xl p-8 border border-primary-foreground/20">
            <Briefcase className="w-8 h-8 text-primary-foreground mb-4" />
            <h3 className="font-heading text-xl font-bold text-primary-foreground mb-2">
              For Universities & Institutions
            </h3>
            <p className="text-primary-foreground/70 mb-6 text-sm leading-relaxed">
              Reach 50,000+ verified academics — from PhD scholars to seasoned professors — and hire faster.
            </p>
            <Button
              onClick={onRecruiterClick}
              variant="secondary"
              className="w-full gap-2 bg-primary-foreground text-primary hover:bg-primary-foreground/90 font-semibold"
            >
              Post a Job
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
