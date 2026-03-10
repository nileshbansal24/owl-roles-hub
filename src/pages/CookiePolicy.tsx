import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const CookiePolicy = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-24 max-w-4xl">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Back to home
        </Link>

        <h1 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-2">Cookie Policy</h1>
        <p className="text-muted-foreground mb-10">Last updated: March 10, 2026</p>

        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8">
          <section>
            <h2 className="font-heading text-xl font-semibold text-foreground mb-3">1. What Are Cookies</h2>
            <p className="text-muted-foreground leading-relaxed">
              Cookies are small text files that are placed on your device when you visit our website. They help us provide you with a better experience by remembering your preferences, keeping you signed in, and understanding how you use our platform.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold text-foreground mb-3">2. Types of Cookies We Use</h2>
            
            <h3 className="font-heading text-lg font-medium text-foreground mt-4 mb-2">Essential Cookies</h3>
            <p className="text-muted-foreground leading-relaxed mb-3">
              These cookies are necessary for the website to function properly. They enable core features such as user authentication, session management, and security. You cannot opt out of these cookies.
            </p>

            <h3 className="font-heading text-lg font-medium text-foreground mt-4 mb-2">Functional Cookies</h3>
            <p className="text-muted-foreground leading-relaxed mb-3">
              These cookies remember your preferences and settings, such as theme selection (light/dark mode), language preferences, and dashboard configurations, to provide a personalized experience.
            </p>

            <h3 className="font-heading text-lg font-medium text-foreground mt-4 mb-2">Analytics Cookies</h3>
            <p className="text-muted-foreground leading-relaxed mb-3">
              We use analytics cookies to understand how visitors interact with our website. This helps us improve our platform's performance and user experience. Data collected is aggregated and anonymous.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold text-foreground mb-3">3. Third-Party Cookies</h2>
            <p className="text-muted-foreground leading-relaxed">
              Some cookies are placed by third-party services that appear on our pages. We use trusted third-party services for authentication and analytics. These services may set their own cookies according to their own privacy policies.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold text-foreground mb-3">4. How to Manage Cookies</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              Most web browsers allow you to control cookies through their settings. You can:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>View what cookies are stored on your device and delete them individually</li>
              <li>Block third-party cookies</li>
              <li>Block cookies from specific websites</li>
              <li>Block all cookies</li>
              <li>Delete all cookies when you close your browser</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-3">
              Please note that blocking or deleting cookies may impact your experience on our platform, and some features may not function properly.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold text-foreground mb-3">5. Cookie Retention</h2>
            <p className="text-muted-foreground leading-relaxed">
              Session cookies are deleted when you close your browser. Persistent cookies remain on your device for a set period or until you delete them. Authentication cookies typically expire after 7 days of inactivity.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold text-foreground mb-3">6. Updates to This Policy</h2>
            <p className="text-muted-foreground leading-relaxed">
              We may update this Cookie Policy from time to time. Any changes will be posted on this page with an updated revision date.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold text-foreground mb-3">7. Contact Us</h2>
            <p className="text-muted-foreground leading-relaxed">
              If you have questions about our use of cookies, please contact us at:<br />
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

export default CookiePolicy;
