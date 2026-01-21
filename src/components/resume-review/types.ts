export interface ParsedExperience {
  title: string;
  company: string;
  location?: string;
  start_date?: string;
  end_date?: string;
  description?: string;
  current?: boolean;
}

export interface ParsedEducation {
  degree: string;
  institution: string;
  field?: string;
  start_year?: string;
  end_year?: string;
}

export interface ParsedResearchPaper {
  title: string;
  journal?: string;
  year?: string;
  doi?: string;
  authors?: string;
}

export interface ParsedResumeData {
  full_name?: string;
  role?: string;
  headline?: string;
  professional_summary?: string;
  location?: string;
  phone?: string;
  email?: string;
  skills?: string[];
  experience?: ParsedExperience[];
  education?: ParsedEducation[];
  achievements?: string[];
  research_papers?: ParsedResearchPaper[];
}

// Current profile data from the database (simpler structure)
export interface CurrentExperience {
  year: string;
  role: string;
  institution: string;
  description: string;
  isCurrent: boolean;
}

export interface CurrentEducation {
  degree: string;
  institution: string;
  years: string;
}

export interface CurrentResearchPaper {
  title: string;
  authors: string;
  date: string;
}

export interface CurrentProfileData {
  full_name?: string | null;
  role?: string | null;
  headline?: string | null;
  professional_summary?: string | null;
  location?: string | null;
  phone?: string | null;
  email?: string | null;
  skills?: string[] | null;
  achievements?: string[] | null;
  experience?: CurrentExperience[] | null;
  education?: CurrentEducation[] | null;
  research_papers?: CurrentResearchPaper[] | null;
}
