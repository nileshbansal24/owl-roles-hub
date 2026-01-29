import { Card, CardContent } from "@/components/ui/card";
import { Briefcase, Users, Search, CheckCircle2 } from "lucide-react";
import type { Job, Application, Profile } from "@/types/recruiter";

interface StatsCardsProps {
  jobs: Job[];
  applications: Application[];
  candidates: Profile[];
}

const StatsCards = ({ jobs, applications, candidates }: StatsCardsProps) => {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <Card className="card-elevated">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Briefcase className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{jobs.length}</p>
              <p className="text-sm text-muted-foreground">Active Jobs</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="card-elevated">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center">
              <Users className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{applications.length}</p>
              <p className="text-sm text-muted-foreground">Applications</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="card-elevated">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <Search className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{candidates.length}</p>
              <p className="text-sm text-muted-foreground">Candidates</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="card-elevated">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center">
              <CheckCircle2 className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {applications.filter(a => a.status === "shortlisted").length}
              </p>
              <p className="text-sm text-muted-foreground">Shortlisted</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StatsCards;
