import * as React from "react";
import { motion } from "framer-motion";
import { Award, Trophy, Star } from "lucide-react";

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
      <div className="text-center py-6">
        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center mx-auto mb-3">
          <Trophy className="h-6 w-6 text-amber-500" />
        </div>
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
        <motion.div
          key={index}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.05 }}
          className="flex items-start gap-3 p-3 rounded-xl bg-gradient-to-r from-amber-500/5 to-transparent border border-amber-500/10 hover:border-amber-500/20 transition-colors"
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shrink-0 shadow-sm">
            <Star className="h-4 w-4 text-white fill-white" />
          </div>
          <div className="flex-1 min-w-0 pt-0.5">
            <p className="text-sm font-medium text-foreground leading-snug">
              {achievement.title}
            </p>
            {(achievement.organization || achievement.year) && (
              <p className="text-xs text-muted-foreground mt-1">
                {achievement.organization}
                {achievement.organization && achievement.year && " • "}
                {achievement.year}
              </p>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default AchievementsList;