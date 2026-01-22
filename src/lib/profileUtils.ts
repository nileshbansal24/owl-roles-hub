// Utility functions for profile data transformation

// DB format interfaces (what's stored in Supabase)
export interface DBExperience {
  title: string;
  company: string;
  location?: string;
  start_date?: string;
  end_date?: string;
  description?: string;
  current?: boolean;
}

export interface DBEducation {
  degree: string;
  institution: string;
  field?: string;
  start_year?: string;
  end_year?: string;
}

export interface DBResearchPaper {
  title: string;
  journal?: string;
  year?: string;
  doi?: string;
  authors?: string;
}

// Display format interfaces (what's shown in UI)
export interface DisplayExperience {
  year: string;
  role: string;
  institution: string;
  description: string;
  isCurrent: boolean;
}

export interface DisplayEducation {
  degree: string;
  institution: string;
  years: string;
}

export interface DisplayResearchPaper {
  title: string;
  authors: string;
  date: string;
}

// Transform DB experience to display format
export function transformExperienceToDisplay(dbExp: DBExperience[]): DisplayExperience[] {
  return dbExp.map((exp) => ({
    year: exp.start_date ? `${exp.start_date} - ${exp.end_date || "Present"}` : "",
    role: exp.title || "",
    institution: exp.company || "",
    description: exp.description || "",
    isCurrent: exp.current || (!exp.end_date && !!exp.start_date),
  }));
}

// Transform display experience to DB format
export function transformExperienceToDB(displayExp: DisplayExperience[]): DBExperience[] {
  return displayExp.map((exp) => {
    const [startDate, endDate] = exp.year.split(" - ").map((s) => s.trim());
    return {
      title: exp.role,
      company: exp.institution,
      start_date: startDate || "",
      end_date: endDate === "Present" ? "" : endDate || "",
      description: exp.description,
      current: exp.isCurrent || endDate === "Present",
    };
  });
}

// Transform DB education to display format
export function transformEducationToDisplay(dbEdu: DBEducation[]): DisplayEducation[] {
  return dbEdu.map((edu) => ({
    degree: edu.degree || "",
    institution: edu.institution || "",
    years: edu.start_year && edu.end_year ? `${edu.start_year} - ${edu.end_year}` : edu.end_year || "",
  }));
}

// Transform display education to DB format
export function transformEducationToDB(displayEdu: DisplayEducation[]): DBEducation[] {
  return displayEdu.map((edu) => {
    const [startYear, endYear] = edu.years.split(" - ").map((s) => s.trim());
    return {
      degree: edu.degree,
      institution: edu.institution,
      start_year: startYear || "",
      end_year: endYear || startYear || "",
    };
  });
}

// Transform DB research papers to display format
export function transformResearchToDisplay(dbPapers: DBResearchPaper[]): DisplayResearchPaper[] {
  return dbPapers.map((paper) => ({
    title: paper.title || "",
    authors: paper.authors || "",
    date: paper.year || "",
  }));
}

// Calculate total years of experience from DB experience data
export function calculateTotalExperience(dbExp: DBExperience[]): number {
  if (!dbExp || dbExp.length === 0) return 0;

  let totalMonths = 0;
  const currentDate = new Date();

  for (const exp of dbExp) {
    const startDate = parseDate(exp.start_date);
    if (!startDate) continue;

    const endDate = exp.current || !exp.end_date ? currentDate : parseDate(exp.end_date);
    if (!endDate) continue;

    const months = (endDate.getFullYear() - startDate.getFullYear()) * 12 + 
                   (endDate.getMonth() - startDate.getMonth());
    totalMonths += Math.max(0, months);
  }

  // Round to nearest 0.5 years
  const years = totalMonths / 12;
  return Math.round(years * 2) / 2;
}

// Parse various date formats (e.g., "Jan 2020", "2020", "January 2020", "01/2020")
function parseDate(dateStr?: string): Date | null {
  if (!dateStr) return null;

  const trimmed = dateStr.trim().toLowerCase();
  
  // Handle "present", "current", etc.
  if (trimmed === "present" || trimmed === "current") {
    return new Date();
  }

  // Try year-only format (e.g., "2020")
  if (/^\d{4}$/.test(trimmed)) {
    return new Date(parseInt(trimmed), 0, 1);
  }

  // Try month/year formats
  const monthNames: Record<string, number> = {
    jan: 0, january: 0, feb: 1, february: 1, mar: 2, march: 2,
    apr: 3, april: 3, may: 4, jun: 5, june: 5, jul: 6, july: 6,
    aug: 7, august: 7, sep: 8, september: 8, oct: 9, october: 9,
    nov: 10, november: 10, dec: 11, december: 11,
  };

  // Match "Month Year" or "Mon Year"
  const monthYearMatch = trimmed.match(/^(\w+)\s+(\d{4})$/);
  if (monthYearMatch) {
    const month = monthNames[monthYearMatch[1]];
    const year = parseInt(monthYearMatch[2]);
    if (month !== undefined) {
      return new Date(year, month, 1);
    }
  }

  // Match "MM/YYYY" or "M/YYYY"
  const slashMatch = trimmed.match(/^(\d{1,2})\/(\d{4})$/);
  if (slashMatch) {
    return new Date(parseInt(slashMatch[2]), parseInt(slashMatch[1]) - 1, 1);
  }

  // Try parsing as ISO date
  const date = new Date(dateStr);
  return isNaN(date.getTime()) ? null : date;
}
