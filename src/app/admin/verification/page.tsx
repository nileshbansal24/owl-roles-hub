"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import AdminVerification from "@/views/AdminVerification";

export default function AdminVerificationPage() {
  return (
    <ProtectedRoute>
      <AdminVerification />
    </ProtectedRoute>
  );
}
