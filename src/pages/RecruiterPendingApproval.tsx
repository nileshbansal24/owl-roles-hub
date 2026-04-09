import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, LogOut, Mail } from "lucide-react";

const RecruiterPendingApproval = () => {
  const { signOut, user } = useAuth();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <Card className="max-w-md w-full">
        <CardContent className="pt-8 pb-6 px-6 text-center space-y-5">
          <div className="mx-auto w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center">
            <Clock className="h-8 w-8 text-amber-600" />
          </div>
          <div>
            <h1 className="font-heading text-2xl font-bold text-foreground">
              Account Pending Approval
            </h1>
            <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
              Your recruiter account is under review. An administrator will verify your details 
              and approve your access shortly. You'll be able to access the recruiter dashboard 
              once approved.
            </p>
          </div>
          {user?.email && (
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Mail className="h-4 w-4" />
              <span>{user.email}</span>
            </div>
          )}
          <Button
            variant="outline"
            onClick={signOut}
            className="w-full"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default RecruiterPendingApproval;
