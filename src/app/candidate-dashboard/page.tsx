"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import CandidateDashboard from "@/views/CandidateDashboard";

export default function CandidateDashboardPage() {
  return (
    <ProtectedRoute>
      <CandidateDashboard />
    </ProtectedRoute>
  );
}
