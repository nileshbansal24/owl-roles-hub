import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { 
  CheckCircle2, 
  Calendar, 
  MapPin, 
  Camera, 
  Loader2,
  Briefcase,
  GraduationCap,
  AlertCircle,
  RefreshCw,
  Check,
} from "lucide-react";

interface ProfileHeaderProps {
  avatarUrl?: string | null;
  name: string;
  email?: string;
  role?: string | null;
  university?: string | null;
  yearsExperience?: number | null;
  calculatedExperience?: number | null;
  location?: string | null;
  phone?: string | null;
  onAvatarUpload?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  uploadingAvatar?: boolean;
  primaryAction?: React.ReactNode;
  secondaryAction?: React.ReactNode;
  onSyncExperience?: () => void;
  syncingExperience?: boolean;
}

export const ProfileHeader = ({
  avatarUrl,
  name,
  email,
  role,
  university,
  yearsExperience,
  calculatedExperience,
  location,
  phone,
  onAvatarUpload,
  uploadingAvatar = false,
  primaryAction,
  secondaryAction,
  onSyncExperience,
  syncingExperience = false,
}: ProfileHeaderProps) => {
  const getInitials = (fullName: string, fallbackEmail?: string) => {
    if (fullName && fullName !== "Your Name") {
      return fullName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
    }
    return fallbackEmail?.slice(0, 2).toUpperCase() || "U";
  };

  // Check if there's a mismatch between stored and calculated experience
  const hasExperienceMismatch = React.useMemo(() => {
    if (calculatedExperience === null || calculatedExperience === undefined) return false;
    if (yearsExperience === null || yearsExperience === undefined) return calculatedExperience > 0;
    // Allow 0.5 year tolerance
    return Math.abs(calculatedExperience - yearsExperience) > 0.5;
  }, [yearsExperience, calculatedExperience]);

  // Display experience value (prefer calculated if available)
  const displayExperience = calculatedExperience ?? yearsExperience;

  // Experience indicator component for reuse
  const ExperienceIndicator = ({ compact = false }: { compact?: boolean }) => {
    if (displayExperience === null || displayExperience === undefined) return null;

    const containerClass = compact
      ? `flex items-center gap-1.5 ${hasExperienceMismatch ? "bg-amber-500/10 border border-amber-500/30" : "bg-secondary/60"} px-2.5 py-1 rounded-full`
      : `flex items-center gap-2 ${hasExperienceMismatch ? "bg-amber-500/10 border border-amber-500/30" : "bg-secondary/50"} px-3 py-1.5 rounded-full`;

    const calendarClass = compact
      ? `h-3.5 w-3.5 ${hasExperienceMismatch ? "text-amber-500" : "text-primary"}`
      : `h-4 w-4 ${hasExperienceMismatch ? "text-amber-500" : "text-primary"}`;

    const textClass = compact ? "font-medium text-xs" : "font-medium text-sm";
    const alertClass = compact ? "h-3 w-3 text-amber-500" : "h-3.5 w-3.5 text-amber-500";

    return (
      <div className="flex items-center gap-1.5">
        <div className={containerClass}>
          <Calendar className={calendarClass} />
          <span className={textClass}>
            {displayExperience} {compact ? "Years" : "Years Experience"}
          </span>
          
          {hasExperienceMismatch && (
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="inline-flex items-center cursor-help">
                  <AlertCircle className={alertClass} />
                </span>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-xs">
                <p className="text-sm">
                  Calculated experience ({calculatedExperience} years) differs from stored value ({yearsExperience ?? 0} years).
                </p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
        
        {hasExperienceMismatch && onSyncExperience && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 rounded-full bg-amber-500/10 hover:bg-amber-500/20 text-amber-600"
                onClick={onSyncExperience}
                disabled={syncingExperience}
              >
                {syncingExperience ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <RefreshCw className="h-3.5 w-3.5" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p className="text-sm">Sync with calculated experience</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative overflow-hidden bg-card rounded-2xl border border-border shadow-card"
    >
      {/* Decorative gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/3" />
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
      
      <div className="relative p-5 md:p-8">
        {/* Desktop Layout */}
        <div className="hidden md:flex items-start gap-8">
          {/* Avatar */}
          <motion.div 
            className="relative group shrink-0"
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <div className="p-1 rounded-full bg-gradient-to-br from-primary/20 to-primary/5">
              <Avatar className="h-28 w-28 lg:h-32 lg:w-32 border-4 border-background shadow-xl">
                <AvatarImage src={avatarUrl || ""} alt={name} className="object-cover" />
                <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground text-2xl lg:text-3xl font-heading font-bold">
                  {getInitials(name, email)}
                </AvatarFallback>
              </Avatar>
            </div>
            {onAvatarUpload && (
              <label className="absolute inset-0 flex items-center justify-center bg-foreground/60 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 cursor-pointer backdrop-blur-sm">
                {uploadingAvatar ? (
                  <Loader2 className="h-6 w-6 text-background animate-spin" />
                ) : (
                  <Camera className="h-6 w-6 text-background" />
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={onAvatarUpload}
                  className="hidden"
                  disabled={uploadingAvatar}
                />
              </label>
            )}
            <Badge className="absolute -bottom-1 -right-1 bg-green-500 text-white border-2 border-background h-7 w-7 p-0 flex items-center justify-center shadow-md">
              <CheckCircle2 className="h-4 w-4" />
            </Badge>
          </motion.div>

          {/* Info */}
          <div className="flex-1 min-w-0 py-1">
            <h1 className="font-heading font-bold text-2xl lg:text-3xl text-foreground mb-2 truncate">
              {name}
            </h1>
            
            <div className="flex items-center gap-2 flex-wrap mb-4">
              {role && (
                <Badge variant="secondary" className="font-medium text-sm px-3 py-1">
                  <Briefcase className="h-3.5 w-3.5 mr-1.5" />
                  {role}
                </Badge>
              )}
              {university && (
                <Badge variant="outline" className="font-normal text-sm px-3 py-1">
                  <GraduationCap className="h-3.5 w-3.5 mr-1.5" />
                  {university}
                </Badge>
              )}
            </div>
            
            <div className="flex flex-wrap items-center gap-5 text-sm text-muted-foreground">
              <ExperienceIndicator compact={false} />
              {location && (
                <div className="flex items-center gap-2 bg-secondary/50 px-3 py-1.5 rounded-full">
                  <MapPin className="h-4 w-4 text-primary" />
                  <span className="font-medium">{location}</span>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 shrink-0">
            {secondaryAction}
            {primaryAction}
          </div>
        </div>

        {/* Mobile Layout */}
        <div className="flex flex-col md:hidden">
          <div className="flex items-center gap-4 mb-5">
            {/* Avatar */}
            <motion.div 
              className="relative group shrink-0"
              whileTap={{ scale: 0.98 }}
            >
              <div className="p-0.5 rounded-full bg-gradient-to-br from-primary/30 to-primary/10">
                <Avatar className="h-20 w-20 border-3 border-background shadow-lg">
                  <AvatarImage src={avatarUrl || ""} alt={name} className="object-cover" />
                  <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground text-xl font-heading font-bold">
                    {getInitials(name, email)}
                  </AvatarFallback>
                </Avatar>
              </div>
              {onAvatarUpload && (
                <label className="absolute inset-0 flex items-center justify-center bg-foreground/60 rounded-full opacity-0 group-hover:opacity-100 active:opacity-100 transition-all cursor-pointer">
                  {uploadingAvatar ? (
                    <Loader2 className="h-5 w-5 text-background animate-spin" />
                  ) : (
                    <Camera className="h-5 w-5 text-background" />
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={onAvatarUpload}
                    className="hidden"
                    disabled={uploadingAvatar}
                  />
                </label>
              )}
              <Badge className="absolute -bottom-0.5 -right-0.5 bg-green-500 text-white border-2 border-background h-6 w-6 p-0 flex items-center justify-center shadow-md">
                <CheckCircle2 className="h-3.5 w-3.5" />
              </Badge>
            </motion.div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <h1 className="font-heading font-bold text-xl text-foreground mb-1 truncate">
                {name}
              </h1>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {role || "Add your role"} {university && `at ${university}`}
              </p>
            </div>
          </div>

          {/* Meta Info Pills */}
          <div className="flex flex-wrap items-center gap-2 mb-5">
            <ExperienceIndicator compact={true} />
            {location && (
              <div className="flex items-center gap-1.5 bg-secondary/60 px-2.5 py-1 rounded-full text-xs">
                <MapPin className="h-3.5 w-3.5 text-primary" />
                <span className="font-medium">{location}</span>
              </div>
            )}
          </div>

          {/* Actions - Full Width on Mobile */}
          <div className="flex gap-3 w-full">
            {secondaryAction && <div className="flex-1 [&>button]:w-full">{secondaryAction}</div>}
            {primaryAction && <div className="flex-1 [&>button]:w-full">{primaryAction}</div>}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ProfileHeader;