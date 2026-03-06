"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import AdminDashboard from "@/views/AdminDashboard";

export default function AdminDashboardPage() {
  return (
    <ProtectedRoute>
      <AdminDashboard />
    </ProtectedRoute>
  );
}
