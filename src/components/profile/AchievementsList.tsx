import * as React from "react";
import { Award, Trophy } from "lucide-react";

interface Achievement {
  title: string;
  organization?: string;
  year?: string;
}

interface AchievementsListProps {
  achievements: Achievement[] | string[];
  emptyMessage?: string;
}

export const AchievementsList = ({
  achievements,
  emptyMessage = "Add your achievements and awards.",
}: AchievementsListProps) => {
  if (achievements.length === 0) {
    return (
      <div className="text-center py-4">
        <Trophy className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  // Handle both string[] and Achievement[] formats
  const normalizedAchievements = achievements.map((item) =>
    typeof item === "string"
      ? { title: item }
      : item
  );

  return (
    <div className="space-y-3">
      {normalizedAchievements.map((achievement, index) => (
        <div key={index} className="flex items-start gap-2.5">
          <div className="w-6 h-6 rounded-full bg-amber-500/10 flex items-center justify-center shrink-0 mt-0.5">
            <Award className="h-3.5 w-3.5 text-amber-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-foreground leading-snug">
              {achievement.title}
            </p>
            {(achievement.organization || achievement.year) && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {achievement.organization}
                {achievement.organization && achievement.year && " • "}
                {achievement.year}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default AchievementsList;
