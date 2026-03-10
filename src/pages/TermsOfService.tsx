import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const TermsOfService = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-24 max-w-4xl">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Back to home
        </Link>

        <h1 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-2">Terms of Service</h1>
        <p className="text-muted-foreground mb-10">Last updated: March 10, 2026</p>

        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8">
          <section>
            <h2 className="font-heading text-xl font-semibold text-foreground mb-3">1. Acceptance of Terms</h2>
            <p className="text-muted-foreground leading-relaxed">
              By accessing or using OWL ROLES ("the Platform"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold text-foreground mb-3">2. Eligibility</h2>
            <p className="text-muted-foreground leading-relaxed">
              You must be at least 18 years of age to use this Platform. By using our services, you represent and warrant that you meet this age requirement and have the legal capacity to enter into these Terms.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold text-foreground mb-3">3. User Accounts</h2>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>You are responsible for maintaining the confidentiality of your account credentials</li>
              <li>You agree to provide accurate, current, and complete information during registration</li>
              <li>You are responsible for all activities that occur under your account</li>
              <li>You must notify us immediately of any unauthorized use of your account</li>
            </ul>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold text-foreground mb-3">4. Candidate Responsibilities</h2>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Provide truthful and accurate information in your profile and applications</li>
              <li>Ensure all uploaded credentials and documents are genuine</li>
              <li>Do not misrepresent your qualifications, experience, or academic achievements</li>
              <li>Respond to communications from recruiters in a professional and timely manner</li>
            </ul>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold text-foreground mb-3">5. Recruiter Responsibilities</h2>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Post only legitimate job openings from authorized institutions</li>
              <li>Provide accurate job descriptions including compensation, location, and requirements</li>
              <li>Comply with all applicable employment and anti-discrimination laws</li>
              <li>Not use candidate information for purposes other than recruitment</li>
              <li>Complete the institution verification process honestly</li>
            </ul>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold text-foreground mb-3">6. Prohibited Conduct</h2>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Posting false, misleading, or fraudulent job listings or profiles</li>
              <li>Harassing, threatening, or discriminating against other users</li>
              <li>Scraping, crawling, or using automated tools to access our platform</li>
              <li>Attempting to circumvent security measures or access unauthorized areas</li>
              <li>Using the platform for any unlawful purpose</li>
            </ul>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold text-foreground mb-3">7. Intellectual Property</h2>
            <p className="text-muted-foreground leading-relaxed">
              All content, trademarks, and intellectual property on the Platform are owned by OWL ROLES or its licensors. You may not reproduce, distribute, or create derivative works without our prior written consent.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold text-foreground mb-3">8. Limitation of Liability</h2>
            <p className="text-muted-foreground leading-relaxed">
              OWL ROLES is not liable for any indirect, incidental, or consequential damages arising from your use of the Platform. We do not guarantee employment outcomes or the accuracy of information provided by other users.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold text-foreground mb-3">9. Termination</h2>
            <p className="text-muted-foreground leading-relaxed">
              We reserve the right to suspend or terminate your account at any time for violation of these Terms. You may also delete your account at any time by contacting support@owlroles.com.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold text-foreground mb-3">10. Governing Law</h2>
            <p className="text-muted-foreground leading-relaxed">
              These Terms shall be governed by and construed in accordance with the laws of India. Any disputes arising out of these Terms shall be subject to the exclusive jurisdiction of the courts in Noida, Uttar Pradesh, India.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold text-foreground mb-3">11. Contact</h2>
            <p className="text-muted-foreground leading-relaxed">
              For questions about these Terms, contact us at:<br />
              Email: support@owlroles.com<br />
              Address: Sector 62, Noida, Uttar Pradesh, India
            </p>
          </section>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default TermsOfService;
