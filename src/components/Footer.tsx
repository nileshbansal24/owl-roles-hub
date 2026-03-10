import { Link } from "react-router-dom";
import { 
  Facebook, 
  Twitter, 
  Linkedin, 
  Instagram, 
  Mail, 
  Phone, 
  MapPin 
} from "lucide-react";

const Footer = () => {
  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <footer className="bg-foreground text-background py-16">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-heading font-bold text-xl">O</span>
              </div>
              <span className="font-heading font-bold text-xl">OWL ROLES</span>
            </div>
            <p className="text-muted-foreground text-sm mb-6">
              India's #1 Academic Job Portal. Connecting talented educators with leading universities.
            </p>
            <div className="flex gap-3">
              <a href="#" className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-primary transition-colors">
                <Facebook className="w-4 h-4" />
              </a>
              <a href="#" className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-primary transition-colors">
                <Twitter className="w-4 h-4" />
              </a>
              <a href="#" className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-primary transition-colors">
                <Linkedin className="w-4 h-4" />
              </a>
              <a href="#" className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-primary transition-colors">
                <Instagram className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* For Candidates */}
          <div>
            <h4 className="font-heading font-semibold text-lg mb-4">For Candidates</h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li><button onClick={() => scrollToSection("featured-jobs")} className="hover:text-primary transition-colors">Browse Jobs</button></li>
              <li><Link to="/auth?mode=signup" className="hover:text-primary transition-colors">Upload Resume</Link></li>
              <li><Link to="/candidate-dashboard" className="hover:text-primary transition-colors">Career Advice</Link></li>
              <li><Link to="/candidate-dashboard" className="hover:text-primary transition-colors">Salary Calculator</Link></li>
              <li><Link to="/candidate-dashboard" className="hover:text-primary transition-colors">Interview Tips</Link></li>
            </ul>
          </div>

          {/* For Recruiters */}
          <div>
            <h4 className="font-heading font-semibold text-lg mb-4">For Recruiters</h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li><Link to="/post-job" className="hover:text-primary transition-colors">Post a Job</Link></li>
              <li><Link to="/recruiter-dashboard?tab=candidates" className="hover:text-primary transition-colors">Search Resumes</Link></li>
              <li><Link to="/recruiter-dashboard" className="hover:text-primary transition-colors">Employer Branding</Link></li>
              <li><Link to="/recruiter-dashboard" className="hover:text-primary transition-colors">Recruitment Solutions</Link></li>
              <li><Link to="/auth?mode=signup" className="hover:text-primary transition-colors">Pricing Plans</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-heading font-semibold text-lg mb-4">Contact Us</h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-primary" />
                <a href="mailto:support@owlroles.com" className="hover:text-primary transition-colors">support@owlroles.com</a>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-primary" />
                <a href="tel:+911800123456" className="hover:text-primary transition-colors">+91 1800-123-4567</a>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-primary mt-0.5" />
                <span>Sector 62, Noida, Uttar Pradesh, India</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-white/10 flex flex-col items-center justify-between gap-4 text-sm text-muted-foreground sm:flex-row">
          <p>© 2026 OWL ROLES. All rights reserved.</p>
          <div className="flex flex-wrap justify-center gap-4 sm:gap-6">
            <Link to="/privacy-policy" className="hover:text-primary transition-colors">Privacy Policy</Link>
            <Link to="/terms-of-service" className="hover:text-primary transition-colors">Terms of Service</Link>
            <Link to="/cookie-policy" className="hover:text-primary transition-colors">Cookie Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
