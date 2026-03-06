"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import RecruiterProfile from "@/views/RecruiterProfile";

export default function RecruiterProfilePage() {
  return (
    <ProtectedRoute>
      <RecruiterProfile />
    </ProtectedRoute>
  );
}
