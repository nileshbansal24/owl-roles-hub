import { Award, Star, Briefcase, User } from "lucide-react";

interface CandidateCategoryBadgeProps {
  category: string;
}

const CandidateCategoryBadge = ({ category }: CandidateCategoryBadgeProps) => {
  switch (category) {
    case "gold":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-gradient-to-r from-yellow-400 to-amber-500 text-yellow-900">
          <Award className="h-3 w-3" />
          Gold
        </span>
      );
    case "silver":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-gradient-to-r from-gray-300 to-slate-400 text-gray-900">
          <Star className="h-3 w-3" />
          Silver
        </span>
      );
    case "bronze":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-gradient-to-r from-orange-400 to-amber-600 text-orange-900">
          <Briefcase className="h-3 w-3" />
          Bronze
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-gradient-to-r from-gray-700 to-gray-900 text-white">
          <User className="h-3 w-3" />
          Fresher
        </span>
      );
  }
};

export default CandidateCategoryBadge;
