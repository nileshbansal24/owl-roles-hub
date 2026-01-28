import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { 
  CheckCircle2, 
  Circle, 
  Briefcase, 
  User, 
  Eye, 
  ArrowRight,
  Trophy,
  Sparkles 
} from "lucide-react";
import { useNavigate } from "react-router-dom";

interface RecruiterProgressChecklistProps {
  hasCompletedProfile: boolean;
  hasPostedJob: boolean;
  hasReviewedCandidate: boolean;
  recruiterName?: string;
}

const RecruiterProgressChecklist = ({
  hasCompletedProfile,
  hasPostedJob,
  hasReviewedCandidate,
  recruiterName,
}: RecruiterProgressChecklistProps) => {
  const navigate = useNavigate();
  
  const milestones = [
    {
      id: "profile",
      title: "Complete your profile",
      description: "Add your details to build trust with candidates",
      completed: hasCompletedProfile,
      icon: User,
      action: () => {},
      actionLabel: "Edit Profile",
    },
    {
      id: "job",
      title: "Post your first job",
      description: "Start attracting qualified candidates",
      completed: hasPostedJob,
      icon: Briefcase,
      action: () => navigate("/post-job"),
      actionLabel: "Post Job",
    },
    {
      id: "review",
      title: "Review a candidate",
      description: "Explore profiles and find the perfect fit",
      completed: hasReviewedCandidate,
      icon: Eye,
      action: () => {},
      actionLabel: "Find Candidates",
    },
  ];

  const completedCount = milestones.filter((m) => m.completed).length;
  const progress = (completedCount / milestones.length) * 100;
  const allComplete = completedCount === milestones.length;

  if (allComplete) {
    return null; // Hide when all milestones are complete
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <Card className="card-elevated border-primary/20">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                {allComplete ? (
                  <Trophy className="h-5 w-5 text-primary" />
                ) : (
                  <Sparkles className="h-5 w-5 text-primary" />
                )}
              </div>
              <div>
                <CardTitle className="text-lg">
                  {recruiterName ? `Welcome, ${recruiterName.split(" ")[0]}!` : "Getting Started"}
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  {completedCount}/{milestones.length} milestones completed
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-2xl font-bold text-primary">{Math.round(progress)}%</span>
            </div>
          </div>
          <Progress value={progress} className="h-2 mt-3" />
        </CardHeader>
        <CardContent className="pt-2">
          <div className="space-y-3">
            {milestones.map((milestone, index) => (
              <motion.div
                key={milestone.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                  milestone.completed
                    ? "bg-primary/5"
                    : "bg-secondary/50 hover:bg-secondary"
                }`}
              >
                <div className="shrink-0">
                  {milestone.completed ? (
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                  ) : (
                    <Circle className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`font-medium text-sm ${
                    milestone.completed ? "text-muted-foreground line-through" : "text-foreground"
                  }`}>
                    {milestone.title}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {milestone.description}
                  </p>
                </div>
                {!milestone.completed && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="shrink-0 gap-1 text-primary hover:text-primary"
                    onClick={milestone.action}
                  >
                    {milestone.actionLabel}
                    <ArrowRight className="h-3 w-3" />
                  </Button>
                )}
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default RecruiterProgressChecklist;
