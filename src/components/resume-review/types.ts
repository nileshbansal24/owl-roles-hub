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
