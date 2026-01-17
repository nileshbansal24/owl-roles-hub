import * as React from "react";
import { motion } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle2, 
  Calendar, 
  MapPin, 
  Camera, 
  Loader2,
  Mail,
  Phone 
} from "lucide-react";

interface ProfileHeaderProps {
  avatarUrl?: string | null;
  name: string;
  email?: string;
  role?: string | null;
  university?: string | null;
  yearsExperience?: number | null;
  location?: string | null;
  phone?: string | null;
  onAvatarUpload?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  uploadingAvatar?: boolean;
  primaryAction?: React.ReactNode;
  secondaryAction?: React.ReactNode;
}

export const ProfileHeader = ({
  avatarUrl,
  name,
  email,
  role,
  university,
  yearsExperience,
  location,
  phone,
  onAvatarUpload,
  uploadingAvatar = false,
  primaryAction,
  secondaryAction,
}: ProfileHeaderProps) => {
  const getInitials = (fullName: string, fallbackEmail?: string) => {
    if (fullName && fullName !== "Your Name") {
      return fullName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
    }
    return fallbackEmail?.slice(0, 2).toUpperCase() || "U";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-card rounded-xl border border-border shadow-card p-4 md:p-6 lg:p-8"
    >
      {/* Desktop Layout */}
      <div className="hidden md:flex items-start gap-6">
        {/* Avatar */}
        <div className="relative group shrink-0">
          <Avatar className="h-24 w-24 lg:h-28 lg:w-28 border-4 border-background shadow-elevated">
            <AvatarImage src={avatarUrl || ""} alt={name} />
            <AvatarFallback className="bg-primary text-primary-foreground text-2xl lg:text-3xl font-heading font-bold">
              {getInitials(name, email)}
            </AvatarFallback>
          </Avatar>
          {onAvatarUpload && (
            <label className="absolute inset-0 flex items-center justify-center bg-foreground/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
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
          <Badge className="absolute -bottom-1 -right-1 bg-primary text-primary-foreground border-2 border-background h-6 w-6 p-0 flex items-center justify-center">
            <CheckCircle2 className="h-3.5 w-3.5" />
          </Badge>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h1 className="font-heading font-bold text-2xl lg:text-3xl text-foreground mb-1 truncate">
            {name}
          </h1>
          <p className="text-base text-muted-foreground mb-3">
            {role || "Title Placeholder"} {university && `at ${university}`}
          </p>
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            {yearsExperience !== null && yearsExperience !== undefined && (
              <div className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-primary" />
                <span>{yearsExperience} Years of Experience</span>
              </div>
            )}
            {location && (
              <div className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-primary" />
                <span>{location}</span>
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
        <div className="flex items-start gap-4 mb-4">
          {/* Avatar */}
          <div className="relative group shrink-0">
            <Avatar className="h-20 w-20 border-4 border-background shadow-elevated">
              <AvatarImage src={avatarUrl || ""} alt={name} />
              <AvatarFallback className="bg-primary text-primary-foreground text-xl font-heading font-bold">
                {getInitials(name, email)}
              </AvatarFallback>
            </Avatar>
            {onAvatarUpload && (
              <label className="absolute inset-0 flex items-center justify-center bg-foreground/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
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
            <Badge className="absolute -bottom-1 -right-1 bg-primary text-primary-foreground border-2 border-background h-5 w-5 p-0 flex items-center justify-center">
              <CheckCircle2 className="h-3 w-3" />
            </Badge>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h1 className="font-heading font-bold text-xl text-foreground mb-0.5 truncate">
              {name}
            </h1>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {role || "Title Placeholder"} {university && `at ${university}`}
            </p>
          </div>
        </div>

        {/* Meta Info */}
        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mb-4">
          {yearsExperience !== null && yearsExperience !== undefined && (
            <div className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5 text-primary" />
              <span>{yearsExperience} Years</span>
            </div>
          )}
          {location && (
            <div className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5 text-primary" />
              <span>{location}</span>
            </div>
          )}
        </div>

        {/* Actions - Full Width on Mobile */}
        <div className="flex flex-col gap-2 w-full">
          {secondaryAction && <div className="w-full [&>button]:w-full">{secondaryAction}</div>}
          {primaryAction && <div className="w-full [&>button]:w-full">{primaryAction}</div>}
        </div>
      </div>
    </motion.div>
  );
};

export default ProfileHeader;
