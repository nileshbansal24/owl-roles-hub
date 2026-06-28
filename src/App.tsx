import React, { useState, lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import CandidateDashboard from "./pages/CandidateDashboard";
import RecruiterDashboard from "./pages/RecruiterDashboard";
import RecruiterProfile from "./pages/RecruiterProfile";
import PostJob from "./pages/PostJob";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import CookiePolicy from "./pages/CookiePolicy";
import NotFound from "./pages/NotFound";
import UpgradePlan from "./pages/UpgradePlan";
import CandidateHome from "./pages/CandidateHome";
import CookieConsent from "@/components/CookieConsent";
import ProtectedRoute from "@/components/ProtectedRoute";

// Admin routes are lazy-loaded so the admin bundle (and its route names)
// never ship to regular users. Reduces attack surface + initial bundle size.
const AdminLogin = lazy(() => import("./pages/AdminLogin"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const AdminVerification = lazy(() => import("./pages/AdminVerification"));

const AdminFallback = () => (
  <div className="min-h-screen flex items-center justify-center text-sm text-muted-foreground">
    Loading…
  </div>
);


const App = () => {
  // Create queryClient inside the component to prevent HMR issues
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
            <CookieConsent />
              <Routes>
                <Route path="/" element={<Index />} />
                <Route
                  path="/jobs"
                  element={
                    <ProtectedRoute requiredRole="candidate">
                      <CandidateHome />
                    </ProtectedRoute>
                  }
                />
                <Route path="/auth" element={<Auth />} />
                <Route
                  path="/candidate-dashboard"
                  element={
                    <ProtectedRoute requiredRole="candidate">
                      <CandidateDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/recruiter-dashboard"
                  element={
                    <ProtectedRoute requiredRole="recruiter">
                      <RecruiterDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/post-job"
                  element={
                    <ProtectedRoute>
                      <PostJob />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/post-job/:jobId"
                  element={
                    <ProtectedRoute>
                      <PostJob />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/recruiter-profile"
                  element={
                    <ProtectedRoute>
                      <RecruiterProfile />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/verification"
                  element={
                    <ProtectedRoute>
                      <AdminVerification />
                    </ProtectedRoute>
                  }
                />
                {/* Hidden Admin Panel - not linked from anywhere */}
                <Route path="/recruiter-upgrade" element={<ProtectedRoute requiredRole="recruiter"><UpgradePlan /></ProtectedRoute>} />
                <Route path="/adpanel" element={<AdminLogin />} />
                <Route path="/adpanel/dashboard" element={<ProtectedRoute requiredRole="admin"><AdminDashboard /></ProtectedRoute>} />
                <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                <Route path="/terms-of-service" element={<TermsOfService />} />
                <Route path="/cookie-policy" element={<CookiePolicy />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
