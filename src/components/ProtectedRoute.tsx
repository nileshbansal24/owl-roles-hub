import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { useState, useEffect } from "react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: "candidate" | "recruiter" | "admin";
}

const ProtectedRoute = ({ children, requiredRole }: ProtectedRouteProps) => {
  const { user, loading } = useAuth();
  const [roleChecked, setRoleChecked] = useState(!requiredRole);
  const [hasAccess, setHasAccess] = useState(true);

  useEffect(() => {
    if (!requiredRole || !user) {
      setRoleChecked(true);
      return;
    }

    if (requiredRole === "admin") {
      supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle()
        .then(({ data }) => {
          setHasAccess(!!data);
          setRoleChecked(true);
        });
    } else {
      supabase
        .from("profiles")
        .select("user_type")
        .eq("id", user.id)
        .maybeSingle()
        .then(({ data }) => {
          const userType = data?.user_type || "candidate";
          setHasAccess(userType === requiredRole);
          setRoleChecked(true);
        });
    }
  }, [user, requiredRole]);

  if (loading || !roleChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (!hasAccess) {
    const redirect = requiredRole === "recruiter" ? "/candidate-dashboard" : "/recruiter-dashboard";
    return <Navigate to={redirect} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
