import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import RecruiterNavbar from "@/components/RecruiterNavbar";
import RecruiterProfilePreviewCard from "@/components/recruiter/RecruiterProfilePreviewCard";
import VerificationRequestCard from "@/components/recruiter/VerificationRequestCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Building2,
  User,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  Linkedin,
  Save,
  Loader2,
  FileText,
  Camera,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { motion } from "framer-motion";

type VerificationStatus = "verified" | "pending" | "rejected" | "none";

interface RecruiterProfileData {
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
}

const EMPTY_PROFILE: RecruiterProfileData = {
  full_name: "",
  university: "",
  role: "",
  email: "",
  phone: "",
  location: "",
  bio: "",
  linkedin_url: "",
  avatar_url: "",
  headline: "",
};

// Weighted completeness — the most impactful fields count more
const COMPLETENESS_FIELDS: Array<{
  key: keyof RecruiterProfileData;
  label: string;
  anchor: string;
  weight: number;
}> = [
  { key: "full_name", label: "Your name", anchor: "full_name", weight: 15 },
  { key: "university", label: "Institution name", anchor: "university", weight: 20 },
  { key: "role", label: "Your role", anchor: "role", weight: 10 },
  { key: "email", label: "Contact email", anchor: "email", weight: 10 },
  { key: "phone", label: "Phone number", anchor: "phone", weight: 5 },
  { key: "location", label: "Location", anchor: "location", weight: 10 },
  { key: "bio", label: "Institution description", anchor: "bio", weight: 15 },
  { key: "linkedin_url", label: "LinkedIn URL", anchor: "linkedin_url", weight: 5 },
  { key: "avatar_url", label: "Logo", anchor: "logo-upload", weight: 5 },
  { key: "headline", label: "Tagline", anchor: "headline", weight: 5 },
];

const RecruiterProfile = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resettingTour, setResettingTour] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>("none");
  const [approvalStatus, setApprovalStatus] = useState<string>("approved");
  const [profile, setProfile] = useState<RecruiterProfileData>(EMPTY_PROFILE);
  const [savedProfile, setSavedProfile] = useState<RecruiterProfileData>(EMPTY_PROFILE);

  useEffect(() => {
    if (!user) {
      navigate("/");
      return;
    }

    const fetchProfileAndVerification = async () => {
      // Parallel fetch — previously sequential
      const [profileRes, verificationRes] = await Promise.all([
        supabase
          .from("profiles")
          .select(
            "full_name, university, role, email, phone, location, bio, linkedin_url, avatar_url, headline, approval_status",
          )
          .eq("id", user.id)
          .maybeSingle(),
        supabase
          .from("institution_verifications")
          .select("status")
          .eq("recruiter_id", user.id)
          .maybeSingle(),
      ]);

      if (profileRes.error) {
        console.error("Error fetching profile:", profileRes.error);
      } else if (profileRes.data) {
        const next: RecruiterProfileData = {
          full_name: profileRes.data.full_name || "",
          university: profileRes.data.university || "",
          role: profileRes.data.role || "",
          email: profileRes.data.email || user.email || "",
          phone: profileRes.data.phone || "",
          location: profileRes.data.location || "",
          bio: profileRes.data.bio || "",
          linkedin_url: profileRes.data.linkedin_url || "",
          avatar_url: profileRes.data.avatar_url || "",
          headline: profileRes.data.headline || "",
        };
        setProfile(next);
        setSavedProfile(next);
        setApprovalStatus((profileRes.data as any).approval_status || "approved");
      }

      if (verificationRes.error) {
        console.error("Error fetching verification:", verificationRes.error);
      } else if (verificationRes.data) {
        setVerificationStatus(verificationRes.data.status as VerificationStatus);
      } else {
        setVerificationStatus("none");
      }

      setLoading(false);
    };

    fetchProfileAndVerification();
  }, [user?.id, navigate]);

  // Compute weighted completeness + list of missing fields
  const { completeness, missing } = useMemo(() => {
    const totalWeight = COMPLETENESS_FIELDS.reduce((s, f) => s + f.weight, 0);
    let earned = 0;
    const missingFields: typeof COMPLETENESS_FIELDS = [];
    for (const field of COMPLETENESS_FIELDS) {
      if ((profile[field.key] || "").trim().length > 0) {
        earned += field.weight;
      } else {
        missingFields.push(field);
      }
    }
    return {
      completeness: Math.round((earned / totalWeight) * 100),
      missing: missingFields,
    };
  }, [profile]);

  const isDirty = useMemo(
    () => JSON.stringify(profile) !== JSON.stringify(savedProfile),
    [profile, savedProfile],
  );

  const scrollToField = (anchor: string) => {
    const el = document.getElementById(anchor);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      // Focus inputs/textareas (logo-upload is a hidden input — open file picker)
      if (anchor === "logo-upload") {
        (el as HTMLInputElement).click();
      } else {
        setTimeout(() => (el as HTMLInputElement | HTMLTextAreaElement).focus?.(), 350);
      }
    }
  };

  const handleInputChange = (field: keyof RecruiterProfileData, value: string) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file (JPG, PNG, etc.)",
        variant: "destructive",
      });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload an image smaller than 5MB",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/logo.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, file, { upsert: true });
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(fileName);
      const avatarUrl = `${urlData.publicUrl}?t=${Date.now()}`;

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: avatarUrl })
        .eq("id", user.id);
      if (updateError) throw updateError;

      setProfile((prev) => ({ ...prev, avatar_url: avatarUrl }));
      setSavedProfile((prev) => ({ ...prev, avatar_url: avatarUrl }));

      toast({ title: "Logo uploaded!", description: "Your institution logo has been updated." });
    } catch (error: any) {
      console.error("Upload error:", error);
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload logo",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: profile.full_name,
          university: profile.university,
          role: profile.role,
          email: profile.email,
          phone: profile.phone,
          location: profile.location,
          bio: profile.bio,
          linkedin_url: profile.linkedin_url,
          headline: profile.headline,
        })
        .eq("id", user.id);
      if (error) throw error;

      setSavedProfile(profile);
      toast({
        title: "Profile saved!",
        description: "Your recruiter profile has been updated successfully.",
      });
    } catch (error: any) {
      console.error("Save error:", error);
      toast({
        title: "Save failed",
        description: error.message || "Failed to save profile",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleResetTour = async () => {
    if (!user) return;
    setResettingTour(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ recruiter_onboarding_completed: false } as any)
        .eq("id", user.id);
      if (error) throw error;
      toast({
        title: "Onboarding tour reset",
        description: "The guided tour will start again next time you visit the dashboard.",
      });
    } catch (error: any) {
      toast({
        title: "Reset failed",
        description: error.message || "Could not reset the onboarding tour",
        variant: "destructive",
      });
    } finally {
      setResettingTour(false);
    }
  };

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <RecruiterNavbar />

      <main className="container mx-auto px-4 py-8 pt-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-heading font-bold text-foreground">
                Recruiter Profile
              </h1>
              <p className="text-muted-foreground mt-1 text-sm sm:text-base">
                Manage your institution details and contact information
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              {isDirty && (
                <Badge variant="outline" className="gap-1.5">
                  <AlertCircle className="h-3 w-3" />
                  Unsaved changes
                </Badge>
              )}
            </div>
          </div>

          {/* Completeness banner */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2
                    className={`h-5 w-5 ${
                      completeness === 100 ? "text-emerald-500" : "text-primary"
                    }`}
                  />
                  <span className="font-heading font-semibold">
                    Profile {completeness}% complete
                  </span>
                </div>
                <span className="text-sm text-muted-foreground">
                  {missing.length} {missing.length === 1 ? "field" : "fields"} remaining
                </span>
              </div>
              <Progress value={completeness} className="h-2" />
              {missing.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {missing.slice(0, 6).map((m) => (
                    <button
                      key={m.key}
                      type="button"
                      onClick={() => scrollToField(m.anchor)}
                      className="text-xs px-3 py-1.5 rounded-full bg-muted hover:bg-muted/70 transition-colors text-muted-foreground hover:text-foreground"
                    >
                      + {m.label}
                    </button>
                  ))}
                  {missing.length > 6 && (
                    <span className="text-xs px-3 py-1.5 text-muted-foreground">
                      +{missing.length - 6} more
                    </span>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Left Column - Profile Forms */}
            <div className="lg:col-span-2 space-y-6">
              {/* Profile Card with Logo */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-primary" />
                    Institution & Logo
                  </CardTitle>
                  <CardDescription>
                    Upload your institution logo and provide organization details
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col md:flex-row gap-8">
                    {/* Logo Upload */}
                    <div className="flex flex-col items-center gap-4">
                      <div className="relative">
                        <Avatar className="h-32 w-32 border-4 border-primary/20">
                          <AvatarImage
                            src={profile.avatar_url}
                            alt={profile.university || "Institution"}
                          />
                          <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">
                            {profile.university ? (
                              getInitials(profile.university)
                            ) : (
                              <Building2 className="h-12 w-12" />
                            )}
                          </AvatarFallback>
                        </Avatar>
                        <label
                          htmlFor="logo-upload"
                          className="absolute bottom-0 right-0 p-2 bg-primary text-primary-foreground rounded-full cursor-pointer hover:bg-primary/90 transition-colors"
                        >
                          {uploading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Camera className="h-4 w-4" />
                          )}
                        </label>
                        <input
                          id="logo-upload"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleAvatarUpload}
                          disabled={uploading}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground text-center">
                        Click to upload institution logo
                        <br />
                        (Max 5MB, JPG/PNG)
                      </p>
                    </div>

                    {/* Institution Details */}
                    <div className="flex-1 space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="university" className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          Institution / College Name *
                        </Label>
                        <Input
                          id="university"
                          placeholder="e.g., Harvard University"
                          value={profile.university}
                          onChange={(e) => handleInputChange("university", e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="headline" className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          Institution Tagline
                        </Label>
                        <Input
                          id="headline"
                          placeholder="e.g., Leading Research University since 1636"
                          value={profile.headline}
                          onChange={(e) => handleInputChange("headline", e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="location" className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          Location
                        </Label>
                        <Input
                          id="location"
                          placeholder="e.g., Cambridge, Massachusetts"
                          value={profile.location}
                          onChange={(e) => handleInputChange("location", e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Recruiter Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5 text-primary" />
                    Your Details
                  </CardTitle>
                  <CardDescription>
                    Your personal information as a recruiter representative
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="full_name" className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        Full Name *
                      </Label>
                      <Input
                        id="full_name"
                        placeholder="Your full name"
                        value={profile.full_name}
                        onChange={(e) => handleInputChange("full_name", e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="role" className="flex items-center gap-2">
                        <Briefcase className="h-4 w-4 text-muted-foreground" />
                        Your Position / Role
                      </Label>
                      <Input
                        id="role"
                        placeholder="e.g., HR Manager, Recruitment Head"
                        value={profile.role}
                        onChange={(e) => handleInputChange("role", e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="email" className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        Contact Email
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="recruiter@institution.edu"
                        value={profile.email}
                        onChange={(e) => handleInputChange("email", e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone" className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        Phone Number
                      </Label>
                      <Input
                        id="phone"
                        placeholder="+1 (555) 123-4567"
                        value={profile.phone}
                        onChange={(e) => handleInputChange("phone", e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="linkedin_url" className="flex items-center gap-2">
                      <Linkedin className="h-4 w-4 text-muted-foreground" />
                      LinkedIn Profile URL
                    </Label>
                    <Input
                      id="linkedin_url"
                      placeholder="https://linkedin.com/in/yourprofile"
                      value={profile.linkedin_url}
                      onChange={(e) => handleInputChange("linkedin_url", e.target.value)}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* About Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    About Your Institution
                  </CardTitle>
                  <CardDescription>
                    Provide a brief description of your institution for candidates
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Label htmlFor="bio">Institution Description</Label>
                    <Textarea
                      id="bio"
                      placeholder="Tell candidates about your institution, its mission, culture, and what makes it a great place to work..."
                      value={profile.bio}
                      onChange={(e) => handleInputChange("bio", e.target.value)}
                      rows={6}
                      className="resize-none"
                    />
                    <p className="text-xs text-muted-foreground">
                      This will be visible to candidates when they view your job postings
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Onboarding Tour Reset */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <RotateCcw className="h-5 w-5 text-primary" />
                    Guided Tour
                  </CardTitle>
                  <CardDescription>
                    Replay the recruiter onboarding walkthrough at any time
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <p className="text-sm text-muted-foreground">
                    Reset the guided tour so it starts again the next time you open your dashboard.
                  </p>
                  <Button
                    variant="outline"
                    onClick={handleResetTour}
                    disabled={resettingTour}
                    className="gap-2 shrink-0"
                  >
                    {resettingTour ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <RotateCcw className="h-4 w-4" />
                    )}
                    Reset Onboarding Tour
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Preview & Verification (sticky on desktop) */}
            <div className="space-y-6 lg:sticky lg:top-24 lg:self-start">
              <RecruiterProfilePreviewCard
                profile={profile}
                verificationStatus={verificationStatus}
              />

              {user && (
                <VerificationRequestCard
                  userId={user.id}
                  status={verificationStatus}
                  onStatusChange={setVerificationStatus}
                />
              )}
            </div>
          </div>
        </motion.div>
      </main>

      {/* Sticky save bar — visible whenever the form has unsaved changes */}
      {isDirty && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          className="fixed bottom-0 inset-x-0 z-40 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80"
        >
          <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm">
              <AlertCircle className="h-4 w-4 text-primary" />
              <span className="hidden sm:inline">You have unsaved changes</span>
              <span className="sm:hidden">Unsaved</span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setProfile(savedProfile)}
                disabled={saving}
              >
                Discard
              </Button>
              <Button onClick={handleSaveProfile} disabled={saving} size="sm" className="gap-2">
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Save Changes
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default RecruiterProfile;
