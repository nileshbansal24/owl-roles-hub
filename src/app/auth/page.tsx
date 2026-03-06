"use client";

import { Suspense } from "react";
import Auth from "@/views/Auth";
import { Loader2 } from "lucide-react";

function AuthFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={<AuthFallback />}>
      <Auth />
    </Suspense>
  );
}
