// Recruiter Dashboard Types

export interface ExperienceItem {
  year: string;
  role: string;
  institution: string;
  description: string;
  isCurrent: boolean;
}

export interface EducationItem {
  degree: string;
  institution: string;
  years: string;
}

export interface ResearchPaper {
  title: string;
  authors: string;
  date: string;
  doi?: string;
  journal?: string;
  citations?: number;
}

export interface ScopusMetrics {
  h_index: number | null;
  document_count: number | null;
  citation_count: number | null;
  co_authors?: Array<{
    name: string;
    author_id?: string;
    affiliation?: string;
  }>;
}

export interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  university: string | null;
  role: string | null;
  bio: string | null;
  years_experience: number | null;
  location: string | null;
  headline: string | null;
  skills: string[] | null;
  user_type: string | null;
  updated_at?: string | null;
  resume_url?: string | null;
  email?: string | null;
  experience?: ExperienceItem[] | null;
  education?: EducationItem[] | null;
  research_papers?: ResearchPaper[] | null;
  achievements?: string[] | null;
  subjects?: string[] | null;
  teaching_philosophy?: string | null;
  professional_summary?: string | null;
  orcid_id?: string | null;
  scopus_link?: string | null;
  scopus_metrics?: ScopusMetrics | null;
  manual_h_index?: number | null;
}

export interface Job {
  id: string;
  title: string;
  institute: string;
  location: string;
  salary_range: string | null;
  job_type: string | null;
  created_at: string;
}

export interface Application {
  id: string;
  job_id: string;
  applicant_id: string;
  applicant_email: string | null;
  cover_letter: string | null;
  status: string;
  created_at: string;
  jobs: {
    title: string;
    institute: string;
  };
  profiles: Profile | null;
}

export interface EnrichedInterview {
  id: string;
  application_id: string;
  job_id: string;
  candidate_id: string;
  recruiter_id: string;
  status: string;
  proposed_times: any;
  confirmed_time: string | null;
  interview_type: string | null;
  meeting_link: string | null;
  location: string | null;
  notes: string | null;
  recruiter_notes: string | null;
  created_at: string;
  updated_at: string;
  job_title: string;
  institute: string;
  candidate_name: string;
  candidate_email: string;
  candidate_avatar: string;
  candidate_role: string;
}

export interface MessageRecipient {
  id: string;
  name: string;
  email: string;
  jobId?: string;
  jobTitle?: string;
  instituteName?: string;
}

// Animation variants
export const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

export const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

// Utility functions
export const calculateCompleteness = (profile: Profile | null): number => {
  if (!profile) return 0;
  const experience = Array.isArray(profile.experience) ? profile.experience : [];
  const education = Array.isArray(profile.education) ? profile.education : [];
  const researchPapers = Array.isArray(profile.research_papers) ? profile.research_papers : [];
  const achievements = Array.isArray(profile.achievements) ? profile.achievements : [];
  
  const fields = [
    !!profile.full_name,
    !!profile.avatar_url,
    !!(profile.role || profile.headline),
    !!profile.university,
    !!profile.location,
    !!(profile.bio || profile.professional_summary),
    experience.length > 0,
    education.length > 0,
    (profile.skills?.length || 0) > 0,
    !!profile.resume_url,
    researchPapers.length > 0,
    achievements.length > 0,
  ];
  return Math.round((fields.filter(Boolean).length / fields.length) * 100);
};

export const getEmploymentStatus = (profile: Profile | null): "fresher" | "working" | "not_working" => {
  if (!profile) return "fresher";
  const experience = Array.isArray(profile.experience) ? profile.experience : [];
  
  if (experience.length === 0) return "fresher";
  
  const hasCurrentJob = experience.some((exp: ExperienceItem) => exp.isCurrent === true);
  
  return hasCurrentJob ? "working" : "not_working";
};

export const getCandidateCategory = (profile: Profile | null) => {
  if (!profile) return "fresher";
  
  const role = profile.role?.toLowerCase() || "";
  const headline = profile.headline?.toLowerCase() || "";
  const experience = profile.years_experience || 0;
  const combinedText = `${role} ${headline}`;
  
  const goldKeywords = ["hod", "head of department", "dean", "vice chancellor", "vc", "pvc", "pro vice chancellor", "director", "principal", "registrar"];
  if (goldKeywords.some(keyword => combinedText.includes(keyword))) {
    return "gold";
  }
  
  const silverKeywords = ["professor", "manager", "senior lecturer", "associate professor", "coordinator", "lead", "head"];
  if (silverKeywords.some(keyword => combinedText.includes(keyword)) && !combinedText.includes("assistant")) {
    return "silver";
  }
  
  const bronzeKeywords = ["assistant professor", "lecturer", "instructor", "teaching assistant", "research associate"];
  if (bronzeKeywords.some(keyword => combinedText.includes(keyword))) {
    return "bronze";
  }
  
  if (experience >= 10) return "silver";
  if (experience >= 3) return "bronze";
  
  return "fresher";
};

export const getStatusColor = (status: string) => {
  switch (status) {
    case "pending":
      return "bg-yellow-500/10 text-yellow-600 border-yellow-500/30";
    case "reviewed":
      return "bg-blue-500/10 text-blue-600 border-blue-500/30";
    case "shortlisted":
      return "bg-green-500/10 text-green-600 border-green-500/30";
    case "rejected":
      return "bg-red-500/10 text-red-600 border-red-500/30";
    default:
      return "bg-muted text-muted-foreground";
  }
};
