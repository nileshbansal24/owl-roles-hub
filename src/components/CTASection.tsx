import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Upload, Briefcase, ArrowRight } from "lucide-react";

interface CTASectionProps {
  onCandidateClick: () => void;
  onRecruiterClick: () => void;
}

const CTASection = ({ onCandidateClick, onRecruiterClick }: CTASectionProps) => {
  return (
    <section className="py-20 bg-gradient-to-br from-primary via-primary to-primary/90 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-full h-full" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      <motion.div
        className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-white/5"
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 10, repeat: Infinity }}
      />

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* For Candidates */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20"
          >
            <div className="w-14 h-14 rounded-xl bg-white/20 flex items-center justify-center mb-6">
              <Upload className="w-7 h-7 text-white" />
            </div>
            <h3 className="font-heading text-2xl font-bold text-white mb-3">
              For Job Seekers
            </h3>
            <p className="text-white/80 mb-6">
              Upload your resume and let top universities find you. Get personalized job recommendations.
            </p>
            <Button 
              onClick={onCandidateClick}
              variant="secondary" 
              className="w-full gap-2 bg-white text-primary hover:bg-white/90"
            >
              Register as Candidate
              <ArrowRight className="w-4 h-4" />
            </Button>
          </motion.div>

          {/* For Recruiters */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20"
          >
            <div className="w-14 h-14 rounded-xl bg-white/20 flex items-center justify-center mb-6">
              <Briefcase className="w-7 h-7 text-white" />
            </div>
            <h3 className="font-heading text-2xl font-bold text-white mb-3">
              For Recruiters
            </h3>
            <p className="text-white/80 mb-6">
              Access 50,000+ verified academic profiles. Find the perfect candidate for your institution.
            </p>
            <Button 
              onClick={onRecruiterClick}
              variant="outline" 
              className="w-full gap-2 border-white text-white hover:bg-white/10"
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
