import { Link } from "react-router-dom";
import {
  Facebook,
  Twitter,
  Linkedin,
  Instagram,
  Mail,
  Phone,
  MapPin,
} from "lucide-react";

const Footer = () => {
  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <footer className="bg-[hsl(222_47%_9%)] text-white/90">
      <div className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
                <span className="text-primary-foreground font-heading font-bold text-xl">O</span>
              </div>
              <span className="font-heading font-bold text-xl tracking-tight">OWL ROLES</span>
            </div>
            <p className="text-white/60 text-sm leading-relaxed mb-6 max-w-xs">
              India's #1 Academic Job Portal. Connecting talented educators with leading universities.
            </p>
            <div className="flex gap-2.5">
              {[
                { Icon: Facebook, label: "Facebook" },
                { Icon: Twitter, label: "Twitter" },
                { Icon: Linkedin, label: "LinkedIn" },
                { Icon: Instagram, label: "Instagram" },
              ].map(({ Icon, label }) => (
                <a
                  key={label}
                  href="#"
                  aria-label={label}
                  className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-primary hover:border-primary transition-all"
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* For Job Seekers */}
          <div>
            <h4 className="font-heading font-semibold text-sm uppercase tracking-wider text-white/90 mb-5">
              For Job Seekers
            </h4>
            <ul className="space-y-3 text-sm text-white/60">
              <li>
                <button
                  onClick={() => scrollToSection("featured-jobs")}
                  className="hover:text-white transition-colors"
                >
                  Browse Jobs
                </button>
              </li>
              <li>
                <Link to="/auth?mode=signup" className="hover:text-white transition-colors">
                  Create Account
                </Link>
              </li>
              <li>
                <Link to="/candidate-dashboard" className="hover:text-white transition-colors">
                  Job Seeker Dashboard
                </Link>
              </li>
              <li>
                <Link to="/auth?mode=login" className="hover:text-white transition-colors">
                  Log In
                </Link>
              </li>
            </ul>
          </div>

          {/* For Recruiters */}
          <div>
            <h4 className="font-heading font-semibold text-sm uppercase tracking-wider text-white/90 mb-5">
              For Recruiters
            </h4>
            <ul className="space-y-3 text-sm text-white/60">
              <li>
                <Link to="/post-job" className="hover:text-white transition-colors">
                  Post a Job
                </Link>
              </li>
              <li>
                <Link
                  to="/recruiter-dashboard?tab=candidates"
                  className="hover:text-white transition-colors"
                >
                  Search Candidates
                </Link>
              </li>
              <li>
                <Link to="/recruiter-dashboard" className="hover:text-white transition-colors">
                  Recruiter Dashboard
                </Link>
              </li>
              <li>
                <Link to="/auth?mode=signup" className="hover:text-white transition-colors">
                  Recruiter Sign Up
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-heading font-semibold text-sm uppercase tracking-wider text-white/90 mb-5">
              Contact Us
            </h4>
            <ul className="space-y-3 text-sm text-white/60">
              <li className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-primary shrink-0" />
                <a
                  href="mailto:support@owlroles.com"
                  className="hover:text-white transition-colors"
                >
                  support@owlroles.com
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-primary shrink-0" />
                <a href="tel:+911800123456" className="hover:text-white transition-colors">
                  +91 1800-123-4567
                </a>
              </li>
              <li className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                <span>Sector 62, Noida, Uttar Pradesh, India</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-white/10 flex flex-col items-center justify-between gap-4 text-sm text-white/50 sm:flex-row">
          <p>© {new Date().getFullYear()} OWL ROLES. All rights reserved.</p>
          <div className="flex flex-wrap justify-center gap-4 sm:gap-6">
            <Link to="/privacy-policy" className="hover:text-white transition-colors">
              Privacy Policy
            </Link>
            <Link to="/terms-of-service" className="hover:text-white transition-colors">
              Terms of Service
            </Link>
            <Link to="/cookie-policy" className="hover:text-white transition-colors">
              Cookie Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
