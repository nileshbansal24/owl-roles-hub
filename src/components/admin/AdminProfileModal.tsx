import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import {
  User, MapPin, Mail, Phone, Briefcase, GraduationCap, Building2,
  FileText, BookOpen, Award, Loader2, ExternalLink, Linkedin
} from "lucide-react";

interface AdminProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string | null;
  userType: "candidate" | "recruiter";
}

const AdminProfileModal = ({ open, onOpenChange, userId, userType }: AdminProfileModalProps) => {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !userId) return;
    setLoading(true);
    supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle()
      .then(({ data }) => {
        setProfile(data);
        setLoading(false);
      });
  }, [open, userId]);

  const education = Array.isArray(profile?.education) ? profile.education : [];
  const experience = Array.isArray(profile?.experience) ? profile.experience : [];
  const researchPapers = Array.isArray(profile?.research_papers) ? profile.research_papers : [];
  const skills = Array.isArray(profile?.skills) ? profile.skills : [];
  const achievements = Array.isArray(profile?.achievements) ? profile.achievements : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            {userType === "candidate" ? "Candidate" : "Recruiter"} Profile
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : !profile ? (
          <p className="text-center text-muted-foreground py-8">Profile not found.</p>
        ) : (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16 ring-2 ring-border">
                <AvatarImage src={profile.avatar_url || ""} />
                <AvatarFallback className="bg-primary text-primary-foreground text-lg font-bold">
                  {profile.full_name?.slice(0, 2).toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <h3 className="font-heading font-bold text-xl text-foreground truncate">
                  {profile.full_name || "Unknown"}
                </h3>
                {profile.headline && (
                  <p className="text-primary text-sm font-medium truncate">{profile.headline}</p>
                )}
                {profile.role && (
                  <p className="text-muted-foreground text-sm">{profile.role}</p>
                )}
              </div>
            </div>

            {/* Contact & Location */}
            <Card>
              <CardContent className="p-4 space-y-2">
                {profile.email && (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <a href={`mailto:${profile.email}`} className="text-primary hover:underline">{profile.email}</a>
                  </div>
                )}
                {profile.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{profile.phone}</span>
                  </div>
                )}
                {profile.location && (
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{profile.location}</span>
                  </div>
                )}
                {profile.university && (
                  <div className="flex items-center gap-2 text-sm">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <span>{profile.university}</span>
                  </div>
                )}
                {profile.linkedin_url && (
                  <div className="flex items-center gap-2 text-sm">
                    <Linkedin className="h-4 w-4 text-muted-foreground" />
                    <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1">
                      LinkedIn <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                )}
                {profile.years_experience != null && profile.years_experience > 0 && (
                  <div className="flex items-center gap-2 text-sm">
                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                    <span>{profile.years_experience} years experience</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Professional Summary */}
            {profile.professional_summary && (
              <div>
                <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                  <FileText className="h-4 w-4" /> Professional Summary
                </h4>
                <p className="text-sm text-muted-foreground leading-relaxed">{profile.professional_summary}</p>
              </div>
            )}

            {/* Bio */}
            {profile.bio && (
              <div>
                <h4 className="font-semibold text-sm mb-2">Bio</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">{profile.bio}</p>
              </div>
            )}

            {/* Skills */}
            {skills.length > 0 && (
              <div>
                <h4 className="font-semibold text-sm mb-2">Skills</h4>
                <div className="flex flex-wrap gap-2">
                  {skills.map((skill: string, i: number) => (
                    <Badge key={i} variant="secondary">{skill}</Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Experience */}
            {experience.length > 0 && (
              <div>
                <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                  <Briefcase className="h-4 w-4" /> Experience ({experience.length})
                </h4>
                <div className="space-y-2">
                  {experience.slice(0, 5).map((exp: any, i: number) => (
                    <div key={i} className="p-3 rounded-lg bg-muted/50 text-sm">
                      <p className="font-medium">{exp.role || exp.title || "Role"}</p>
                      <p className="text-muted-foreground">{exp.institution || exp.company || ""} • {exp.year || exp.years || ""}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Education */}
            {education.length > 0 && (
              <div>
                <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                  <GraduationCap className="h-4 w-4" /> Education ({education.length})
                </h4>
                <div className="space-y-2">
                  {education.map((edu: any, i: number) => (
                    <div key={i} className="p-3 rounded-lg bg-muted/50 text-sm">
                      <p className="font-medium">{edu.degree || "Degree"}</p>
                      <p className="text-muted-foreground">{edu.institution || ""} • {edu.years || ""}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Research Papers */}
            {researchPapers.length > 0 && (
              <div>
                <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                  <BookOpen className="h-4 w-4" /> Publications ({researchPapers.length})
                </h4>
                <div className="space-y-2">
                  {researchPapers.slice(0, 5).map((paper: any, i: number) => (
                    <div key={i} className="p-3 rounded-lg bg-muted/50 text-sm">
                      <p className="font-medium">{paper.title || "Paper"}</p>
                      <p className="text-muted-foreground">{paper.journal || ""} • {paper.date || ""}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Achievements */}
            {achievements.length > 0 && (
              <div>
                <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                  <Award className="h-4 w-4" /> Achievements
                </h4>
                <ul className="space-y-1">
                  {achievements.map((a: string, i: number) => (
                    <li key={i} className="text-sm text-muted-foreground">• {a}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Salary Info (Admin only) */}
            {(profile.current_salary || profile.expected_salary) && (
              <Card>
                <CardContent className="p-4">
                  <h4 className="font-semibold text-sm mb-2">Salary Information</h4>
                  <div className="flex gap-6 text-sm">
                    {profile.current_salary != null && profile.current_salary > 0 && (
                      <div>
                        <span className="text-muted-foreground">Current: </span>
                        <span className="font-medium">₹{(profile.current_salary / 100000).toFixed(1)} LPA</span>
                      </div>
                    )}
                    {profile.expected_salary != null && profile.expected_salary > 0 && (
                      <div>
                        <span className="text-muted-foreground">Expected: </span>
                        <span className="font-medium text-primary">₹{(profile.expected_salary / 100000).toFixed(1)} LPA</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AdminProfileModal;
