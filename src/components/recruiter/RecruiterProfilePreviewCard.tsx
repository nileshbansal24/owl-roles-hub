import { motion } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import VerificationBadge from "./VerificationBadge";
import {
  Building2,
  MapPin,
  Mail,
  Phone,
  Linkedin,
  ExternalLink,
  Briefcase,
  Eye,
} from "lucide-react";

type VerificationStatus = "verified" | "pending" | "rejected" | "none";

interface RecruiterProfilePreviewProps {
  profile: {
    full_name: string;
    university: string;
    role: string;
    email: string;
    phone: string;
    location: string;
    bio: string;
    linkedin_url: string;
    avatar_url: string;
    headline: string;
  };
  verificationStatus: VerificationStatus;
}

const RecruiterProfilePreviewCard = ({
  profile,
  verificationStatus,
}: RecruiterProfilePreviewProps) => {
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Eye className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">Profile Preview</CardTitle>
        </div>
        <p className="text-sm text-muted-foreground">
          How candidates will see your institution on job listings
        </p>
      </CardHeader>
      <CardContent>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-xl bg-secondary/30 border border-border"
        >
          {/* Institution Header */}
          <div className="flex items-start gap-4">
            <Avatar className="h-16 w-16 border-2 border-primary/20 shrink-0">
              <AvatarImage
                src={profile.avatar_url}
                alt={profile.university || "Institution"}
              />
              <AvatarFallback className="bg-primary/10 text-primary font-bold text-lg">
                {profile.university ? (
                  getInitials(profile.university)
                ) : (
                  <Building2 className="h-8 w-8" />
                )}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-heading font-semibold text-foreground text-lg truncate">
                  {profile.university || "Your Institution Name"}
                </h3>
                <VerificationBadge status={verificationStatus} size="sm" />
              </div>

              {profile.headline && (
                <p className="text-sm text-muted-foreground mt-0.5 line-clamp-1">
                  {profile.headline}
                </p>
              )}

              <div className="flex items-center gap-3 mt-2 flex-wrap">
                {profile.location && (
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5" />
                    <span>{profile.location}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Description */}
          {profile.bio && (
            <div className="mt-4 pt-4 border-t border-border">
              <p className="text-sm text-muted-foreground line-clamp-3">
                {profile.bio}
              </p>
            </div>
          )}

          {/* Recruiter Contact Preview */}
          <div className="mt-4 pt-4 border-t border-border">
            <p className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wide">
              Posted by
            </p>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Briefcase className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-foreground truncate">
                  {profile.full_name || "Your Name"}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {profile.role || "Recruiter"} at{" "}
                  {profile.university || "Your Institution"}
                </p>
              </div>
            </div>

            {/* Contact Info */}
            <div className="flex flex-wrap gap-2 mt-3">
              {profile.email && (
                <Badge variant="outline" className="gap-1 text-xs">
                  <Mail className="h-3 w-3" />
                  {profile.email}
                </Badge>
              )}
              {profile.linkedin_url && (
                <Badge variant="outline" className="gap-1 text-xs">
                  <Linkedin className="h-3 w-3" />
                  LinkedIn
                </Badge>
              )}
            </div>
          </div>
        </motion.div>
      </CardContent>
    </Card>
  );
};

export default RecruiterProfilePreviewCard;
