"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import PostJob from "@/views/PostJob";

export default function PostJobPage() {
  return (
    <ProtectedRoute>
      <PostJob />
    </ProtectedRoute>
  );
}
