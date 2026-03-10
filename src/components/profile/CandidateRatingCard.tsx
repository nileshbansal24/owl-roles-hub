import * as React from "react";
import { motion } from "framer-motion";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Star, GraduationCap, BookOpen, Briefcase, Target, UserCheck } from "lucide-react";

interface RatingParam {
  label: string;
  score: number; // 0-5
  icon: React.ReactNode;
  tooltip: string;
}

interface CandidateRatingProps {
  education?: any[] | null;
  researchPapers?: any[] | null;
  yearsExperience?: number | null;
  skills?: string[] | null;
  hIndex?: number | null;
  citations?: number | null;
  resumeUrl?: string | null;
  achievements?: string[] | null;
  professionalSummary?: string | null;
  role?: string | null;
  bio?: string | null;
  avatarUrl?: string | null;
  fullName?: string | null;
  location?: string | null;
  university?: string | null;
}

function clampScore(val: number): number {
  return Math.min(5, Math.max(0, Math.round(val * 10) / 10));
}

function calcAcademicScore(props: CandidateRatingProps): { score: number; tooltip: string } {
  let score = 0;
  const edu = Array.isArray(props.education) ? props.education : [];

  // Degree level scoring (max 2.5)
  const degreeText = edu.map(e => (e.degree || "").toLowerCase()).join(" ");
  if (degreeText.includes("ph.d") || degreeText.includes("phd") || degreeText.includes("doctorate")) {
    score += 2.5;
  } else if (degreeText.includes("m.tech") || degreeText.includes("master") || degreeText.includes("mba") || degreeText.includes("m.sc") || degreeText.includes("m.a")) {
    score += 2;
  } else if (degreeText.includes("b.tech") || degreeText.includes("bachelor") || degreeText.includes("b.sc") || degreeText.includes("b.a") || degreeText.includes("bba")) {
    score += 1.5;
  } else if (edu.length > 0) {
    score += 1;
  }

  // Number of degrees (max 1.5)
  if (edu.length >= 3) score += 1.5;
  else if (edu.length === 2) score += 1;
  else if (edu.length === 1) score += 0.5;

  // University filled (0.5)
  if (props.university) score += 0.5;

  // Achievements bonus (0.5)
  const achievements = Array.isArray(props.achievements) ? props.achievements : [];
  if (achievements.length >= 3) score += 0.5;
  else if (achievements.length >= 1) score += 0.25;

  const finalScore = clampScore(score);
  const tips = [];
  if (edu.length === 0) tips.push("Add education details");
  if (achievements.length === 0) tips.push("Add achievements");
  return { score: finalScore, tooltip: tips.length > 0 ? `Improve: ${tips.join(", ")}` : "Strong academic record" };
}

function calcResearchScore(props: CandidateRatingProps): { score: number; tooltip: string } {
  let score = 0;
  const papers = Array.isArray(props.researchPapers) ? props.researchPapers : [];
  const hIndex = props.hIndex || 0;
  const citations = props.citations || 0;

  // Publications count (max 2)
  if (papers.length >= 10) score += 2;
  else if (papers.length >= 5) score += 1.5;
  else if (papers.length >= 2) score += 1;
  else if (papers.length === 1) score += 0.5;

  // h-index (max 1.5)
  if (hIndex >= 10) score += 1.5;
  else if (hIndex >= 5) score += 1;
  else if (hIndex >= 1) score += 0.5;

  // Citations (max 1.5)
  if (citations >= 100) score += 1.5;
  else if (citations >= 30) score += 1;
  else if (citations >= 5) score += 0.5;

  const finalScore = clampScore(score);
  const tips = [];
  if (papers.length === 0) tips.push("Add research papers");
  if (hIndex === 0) tips.push("Add h-index or Scopus");
  return { score: finalScore, tooltip: tips.length > 0 ? `Improve: ${tips.join(", ")}` : "Excellent research profile" };
}

function calcExperienceScore(props: CandidateRatingProps): { score: number; tooltip: string } {
  const years = props.yearsExperience || 0;
  let score = 0;

  if (years >= 15) score = 5;
  else if (years >= 10) score = 4;
  else if (years >= 5) score = 3;
  else if (years >= 2) score = 2;
  else if (years >= 1) score = 1;
  else score = 0;

  // Role seniority bonus (up to +0.5)
  const role = (props.role || "").toLowerCase();
  const seniorRoles = ["professor", "dean", "hod", "director", "principal", "head"];
  if (seniorRoles.some(r => role.includes(r))) score = Math.min(5, score + 0.5);

  return { score: clampScore(score), tooltip: years === 0 ? "Improve: Add work experience" : `${years} years of professional experience` };
}

function calcSkillsScore(props: CandidateRatingProps): { score: number; tooltip: string } {
  const skills = Array.isArray(props.skills) ? props.skills : [];
  let score = 0;

  if (skills.length >= 10) score = 3;
  else if (skills.length >= 5) score = 2;
  else if (skills.length >= 2) score = 1;
  else if (skills.length === 1) score = 0.5;

  // Professional summary (max 1)
  const summary = props.professionalSummary || props.bio || "";
  if (summary.length >= 200) score += 1;
  else if (summary.length >= 50) score += 0.5;

  // Resume uploaded (1)
  if (props.resumeUrl) score += 1;

  return { score: clampScore(score), tooltip: skills.length === 0 ? "Improve: Add your skills" : `${skills.length} skills listed` };
}

function calcProfileScore(props: CandidateRatingProps): { score: number; tooltip: string } {
  let filled = 0;
  const total = 10;

  if (props.fullName) filled++;
  if (props.avatarUrl) filled++;
  if (props.role) filled++;
  if (props.university) filled++;
  if (props.location) filled++;
  if (props.professionalSummary || props.bio) filled++;
  if (props.resumeUrl) filled++;
  if ((props.skills || []).length > 0) filled++;
  if ((Array.isArray(props.education) ? props.education : []).length > 0) filled++;
  if ((Array.isArray(props.researchPapers) ? props.researchPapers : []).length > 0 || (props.achievements || []).length > 0) filled++;

  const score = clampScore((filled / total) * 5);
  const missing = total - filled;
  return { score, tooltip: missing > 0 ? `Complete ${missing} more section${missing > 1 ? "s" : ""} to improve` : "Profile fully completed!" };
}

const StarRating = ({ score, size = 16 }: { score: number; size?: number }) => {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => {
        const fill = score >= i ? 1 : score >= i - 0.5 ? 0.5 : 0;
        return (
          <div key={i} className="relative" style={{ width: size, height: size }}>
            <Star
              className="absolute inset-0 text-muted-foreground/20"
              style={{ width: size, height: size }}
            />
            {fill > 0 && (
              <div
                className="absolute inset-0 overflow-hidden"
                style={{ width: `${fill * 100}%` }}
              >
                <Star
                  className="text-amber-500 fill-amber-500"
                  style={{ width: size, height: size }}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export const CandidateRatingCard = (props: CandidateRatingProps) => {
  const ratings: RatingParam[] = React.useMemo(() => {
    const academic = calcAcademicScore(props);
    const research = calcResearchScore(props);
    const experience = calcExperienceScore(props);
    const skills = calcSkillsScore(props);
    const profile = calcProfileScore(props);

    return [
      { label: "Academic Record", score: academic.score, icon: <GraduationCap className="h-4 w-4" />, tooltip: academic.tooltip },
      { label: "Research", score: research.score, icon: <BookOpen className="h-4 w-4" />, tooltip: research.tooltip },
      { label: "Experience", score: experience.score, icon: <Briefcase className="h-4 w-4" />, tooltip: experience.tooltip },
      { label: "Skills & Expertise", score: skills.score, icon: <Target className="h-4 w-4" />, tooltip: skills.tooltip },
      { label: "Profile Strength", score: profile.score, icon: <UserCheck className="h-4 w-4" />, tooltip: profile.tooltip },
    ];
  }, [props]);

  const overallScore = React.useMemo(() => {
    const avg = ratings.reduce((sum, r) => sum + r.score, 0) / ratings.length;
    return Math.round(avg * 10) / 10;
  }, [ratings]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.2 }}
      className="bg-card rounded-2xl border border-border shadow-card p-4 md:p-5"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-heading font-semibold text-sm md:text-base text-foreground">
          Candidate Rating
        </h3>
        <div className="flex items-center gap-2">
          <StarRating score={overallScore} size={18} />
          <span className="text-sm font-bold text-foreground">{overallScore}</span>
          <span className="text-xs text-muted-foreground">/5</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {ratings.map((r, idx) => (
          <Tooltip key={r.label}>
            <TooltipTrigger asChild>
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 * idx }}
                className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-secondary/40 border border-border/50 hover:bg-secondary/60 transition-colors cursor-default"
              >
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                  {r.icon}
                </div>
                <span className="text-xs font-medium text-foreground text-center leading-tight">
                  {r.label}
                </span>
                <StarRating score={r.score} size={13} />
                <span className="text-xs font-semibold text-muted-foreground">
                  {r.score}/5
                </span>
              </motion.div>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-xs">
              <p className="text-sm">{r.tooltip}</p>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </motion.div>
  );
};

export default CandidateRatingCard;
