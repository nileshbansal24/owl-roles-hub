import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Trophy, 
  Medal, 
  Crown,
  Sparkles,
  Lock,
  Check
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Milestone {
  id: string;
  threshold: number;
  label: string;
  icon: React.ElementType;
  description: string;
  gradient: string;
  glowColor: string;
  unlocked: boolean;
}

interface ProfileMilestoneBadgesProps {
  completionPercentage: number;
  className?: string;
}

export const ProfileMilestoneBadges = ({ 
  completionPercentage,
  className 
}: ProfileMilestoneBadgesProps) => {
  const milestones: Milestone[] = [
    {
      id: "starter",
      threshold: 50,
      label: "Rising Star",
      icon: Medal,
      description: "Profile 50% complete",
      gradient: "from-amber-400 via-yellow-500 to-amber-600",
      glowColor: "shadow-amber-500/30",
      unlocked: completionPercentage >= 50,
    },
    {
      id: "achiever",
      threshold: 75,
      label: "Profile Pro",
      icon: Trophy,
      description: "Profile 75% complete",
      gradient: "from-blue-400 via-indigo-500 to-purple-600",
      glowColor: "shadow-indigo-500/30",
      unlocked: completionPercentage >= 75,
    },
    {
      id: "master",
      threshold: 100,
      label: "All-Star",
      icon: Crown,
      description: "Profile 100% complete",
      gradient: "from-emerald-400 via-teal-500 to-cyan-600",
      glowColor: "shadow-emerald-500/30",
      unlocked: completionPercentage >= 100,
    },
  ];

  const unlockedCount = milestones.filter(m => m.unlocked).length;

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          Milestones
        </h4>
        <span className="text-xs text-muted-foreground">
          {unlockedCount}/{milestones.length} unlocked
        </span>
      </div>
      
      <div className="grid grid-cols-3 gap-2">
        <AnimatePresence>
          {milestones.map((milestone, index) => (
            <motion.div
              key={milestone.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ 
                opacity: 1, 
                scale: 1,
                transition: { delay: index * 0.1 }
              }}
              className="relative"
            >
              <motion.div
                className={cn(
                  "relative flex flex-col items-center p-3 rounded-xl border transition-all duration-300",
                  milestone.unlocked 
                    ? `bg-gradient-to-br ${milestone.gradient} border-transparent shadow-lg ${milestone.glowColor}` 
                    : "bg-secondary/50 border-border/50"
                )}
                whileHover={milestone.unlocked ? { 
                  scale: 1.05,
                  rotate: [0, -2, 2, 0],
                  transition: { duration: 0.3 }
                } : {}}
              >
                {/* Badge Icon */}
                <div className={cn(
                  "relative flex items-center justify-center w-10 h-10 rounded-full mb-1.5",
                  milestone.unlocked 
                    ? "bg-white/20 backdrop-blur-sm" 
                    : "bg-muted/50"
                )}>
                  {milestone.unlocked ? (
                    <>
                      <milestone.icon className="h-5 w-5 text-white" />
                      {/* Sparkle effect for unlocked badges */}
                      <motion.div
                        className="absolute -top-1 -right-1"
                        animate={{ 
                          scale: [1, 1.2, 1],
                          opacity: [0.7, 1, 0.7]
                        }}
                        transition={{ 
                          duration: 2, 
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                      >
                        <Sparkles className="h-3 w-3 text-white" />
                      </motion.div>
                    </>
                  ) : (
                    <Lock className="h-4 w-4 text-muted-foreground/50" />
                  )}
                </div>

                {/* Label */}
                <span className={cn(
                  "text-[10px] font-semibold text-center leading-tight",
                  milestone.unlocked ? "text-white" : "text-muted-foreground"
                )}>
                  {milestone.label}
                </span>

                {/* Threshold indicator */}
                <span className={cn(
                  "text-[9px] mt-0.5",
                  milestone.unlocked ? "text-white/80" : "text-muted-foreground/60"
                )}>
                  {milestone.threshold}%
                </span>

                {/* Unlocked checkmark */}
                {milestone.unlocked && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 w-4 h-4 bg-white rounded-full flex items-center justify-center shadow-md"
                  >
                    <Check className="h-2.5 w-2.5 text-green-600" />
                  </motion.div>
                )}
              </motion.div>

              {/* Progress indicator towards next milestone */}
              {!milestone.unlocked && completionPercentage > 0 && (
                <div className="mt-1.5">
                  <div className="h-1 bg-border rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-primary/60 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ 
                        width: `${Math.min(100, (completionPercentage / milestone.threshold) * 100)}%` 
                      }}
                      transition={{ duration: 0.5, delay: 0.3 }}
                    />
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Next milestone encouragement */}
      {completionPercentage < 100 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="p-2.5 rounded-lg bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 border border-primary/10"
        >
          <p className="text-xs text-center text-muted-foreground">
            {completionPercentage < 50 && (
              <>
                <span className="text-primary font-medium">{50 - completionPercentage}%</span> more to unlock <span className="font-semibold">Rising Star</span> badge!
              </>
            )}
            {completionPercentage >= 50 && completionPercentage < 75 && (
              <>
                <span className="text-primary font-medium">{75 - completionPercentage}%</span> more to unlock <span className="font-semibold">Profile Pro</span> badge!
              </>
            )}
            {completionPercentage >= 75 && completionPercentage < 100 && (
              <>
                <span className="text-primary font-medium">{100 - completionPercentage}%</span> more to unlock <span className="font-semibold">All-Star</span> badge!
              </>
            )}
          </p>
        </motion.div>
      )}

      {/* Celebration for 100% */}
      {completionPercentage >= 100 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-3 rounded-lg bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-cyan-500/10 border border-emerald-500/20"
        >
          <div className="flex items-center justify-center gap-2">
            <Crown className="h-4 w-4 text-emerald-600" />
            <p className="text-sm font-medium text-emerald-700">
              All milestones unlocked! 🎉
            </p>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default ProfileMilestoneBadges;
