"use client";

import { Suspense } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import RecruiterDashboard from "@/views/RecruiterDashboard";
import { Loader2 } from "lucide-react";

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}

export default function RecruiterDashboardPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <ProtectedRoute>
        <RecruiterDashboard />
      </ProtectedRoute>
    </Suspense>
  );
}
