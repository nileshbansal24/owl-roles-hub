import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import RecruiterNavbar from "@/components/RecruiterNavbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import {
  Building2,
  User,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  Linkedin,
  Upload,
  Save,
  Loader2,
  Globe,
  Users,
  FileText,
  Camera,
} from "lucide-react";
import { motion } from "framer-motion";

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

const RecruiterProfile = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [profile, setProfile] = useState<RecruiterProfileData>({
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
  });

  useEffect(() => {
    if (!user) {
      navigate("/");
      return;
    }

    const fetchProfile = async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("full_name, university, role, email, phone, location, bio, linkedin_url, avatar_url, headline")
        .eq("id", user.id)
        .maybeSingle();

      if (error) {
        console.error("Error fetching profile:", error);
      } else if (data) {
        setProfile({
          full_name: data.full_name || "",
          university: data.university || "",
          role: data.role || "",
          email: data.email || user.email || "",
          phone: data.phone || "",
          location: data.location || "",
          bio: data.bio || "",
          linkedin_url: data.linkedin_url || "",
          avatar_url: data.avatar_url || "",
          headline: data.headline || "",
        });
      }
      setLoading(false);
    };

    fetchProfile();
  }, [user, navigate]);

  const handleInputChange = (field: keyof RecruiterProfileData, value: string) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file (JPG, PNG, etc.)",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 5MB)
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

      // Upload to avatars bucket
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(fileName);

      const avatarUrl = `${urlData.publicUrl}?t=${Date.now()}`;

      // Update profile with new avatar URL
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: avatarUrl })
        .eq("id", user.id);

      if (updateError) throw updateError;

      setProfile((prev) => ({ ...prev, avatar_url: avatarUrl }));

      toast({
        title: "Logo uploaded!",
        description: "Your institution logo has been updated.",
      });
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

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <RecruiterNavbar />

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-heading font-bold text-foreground">
                Recruiter Profile
              </h1>
              <p className="text-muted-foreground mt-1">
                Manage your institution details and contact information
              </p>
            </div>
            <Button onClick={handleSaveProfile} disabled={saving} className="gap-2">
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Save Changes
            </Button>
          </div>

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
                      <AvatarImage src={profile.avatar_url} alt={profile.university || "Institution"} />
                      <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">
                        {profile.university ? getInitials(profile.university) : <Building2 className="h-12 w-12" />}
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

          {/* Save Button (Mobile) */}
          <div className="md:hidden">
            <Button onClick={handleSaveProfile} disabled={saving} className="w-full gap-2">
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Save Changes
            </Button>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default RecruiterProfile;
