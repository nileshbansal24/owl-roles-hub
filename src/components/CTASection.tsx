import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Upload, Briefcase, ArrowRight } from "lucide-react";

interface CTASectionProps {
  onCandidateClick: () => void;
  onRecruiterClick: () => void;
}

const CTASection = ({ onCandidateClick, onRecruiterClick }: CTASectionProps) => {
  return (
    <section className="py-20 bg-primary relative overflow-hidden">
      {/* Subtle pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
          backgroundSize: '32px 32px',
        }} />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="font-heading text-3xl md:text-4xl font-extrabold text-primary-foreground mb-3 tracking-tight">
            Ready to Take the Next Step?
          </h2>
          <p className="text-primary-foreground/70 max-w-xl mx-auto">
            Join thousands of educators and institutions building academic excellence together
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            whileHover={{ y: -4 }}
            className="bg-primary-foreground/10 backdrop-blur-sm rounded-2xl p-8 border border-primary-foreground/20"
          >
            <Upload className="w-8 h-8 text-primary-foreground mb-4" />
            <h3 className="font-heading text-xl font-bold text-primary-foreground mb-2">
              For Job Seekers
            </h3>
            <p className="text-primary-foreground/70 mb-6 text-sm leading-relaxed">
              Upload your resume and let top universities find you. Get personalized job recommendations.
            </p>
            <Button
              onClick={onCandidateClick}
              variant="secondary"
              className="w-full gap-2 bg-primary-foreground text-primary hover:bg-primary-foreground/90 font-semibold"
            >
              Register as Candidate
              <ArrowRight className="w-4 h-4" />
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            whileHover={{ y: -4 }}
            className="bg-primary-foreground/10 backdrop-blur-sm rounded-2xl p-8 border border-primary-foreground/20"
          >
            <Briefcase className="w-8 h-8 text-primary-foreground mb-4" />
            <h3 className="font-heading text-xl font-bold text-primary-foreground mb-2">
              For Recruiters
            </h3>
            <p className="text-primary-foreground/70 mb-6 text-sm leading-relaxed">
              Access 50,000+ verified academic profiles. Find the perfect candidate for your institution.
            </p>
            <Button
              onClick={onRecruiterClick}
              variant="secondary"
              className="w-full gap-2 bg-primary-foreground text-primary hover:bg-primary-foreground/90 font-semibold"
            >
              Post a Job
              <ArrowRight className="w-4 h-4" />
            </Button>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
