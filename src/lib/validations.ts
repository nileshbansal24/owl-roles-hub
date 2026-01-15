import { z } from "zod";

// Common validation patterns
const nameRegex = /^[\p{L}\p{M}\s\-'.]+$/u;
const safeTextRegex = /^[\p{L}\p{M}\p{N}\s\-'.,!?():;@#&*+=\[\]{}|\\/<>""'']+$/u;

// Auth schemas
export const authSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Email is required")
    .email("Please enter a valid email address")
    .max(255, "Email must be less than 255 characters"),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .max(72, "Password must be less than 72 characters"),
  fullName: z
    .string()
    .trim()
    .max(100, "Name must be less than 100 characters")
    .regex(nameRegex, "Name contains invalid characters")
    .optional(),
});

export type AuthFormData = z.infer<typeof authSchema>;

// Job posting schema
export const jobPostingSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Job title is required")
    .max(200, "Job title must be less than 200 characters"),
  institute: z
    .string()
    .trim()
    .min(1, "Institution is required")
    .max(200, "Institution name must be less than 200 characters"),
  location: z
    .string()
    .trim()
    .min(1, "Location is required")
    .max(100, "Location must be less than 100 characters"),
  description: z
    .string()
    .trim()
    .max(5000, "Description must be less than 5000 characters")
    .optional()
    .or(z.literal("")),
  salary_range: z
    .string()
    .trim()
    .max(100, "Salary range must be less than 100 characters")
    .optional()
    .or(z.literal("")),
  job_type: z.enum(["Full Time", "Part Time", "Contract", "Visiting"]),
  tags: z
    .string()
    .max(500, "Tags must be less than 500 characters total")
    .optional()
    .or(z.literal("")),
});

export type JobPostingFormData = z.infer<typeof jobPostingSchema>;

// Profile edit schema
export const profileEditSchema = z.object({
  full_name: z
    .string()
    .trim()
    .max(100, "Name must be less than 100 characters")
    .regex(nameRegex, "Name contains invalid characters")
    .optional()
    .or(z.literal("")),
  role: z
    .string()
    .trim()
    .max(100, "Role must be less than 100 characters")
    .optional()
    .or(z.literal("")),
  university: z
    .string()
    .trim()
    .max(200, "University must be less than 200 characters")
    .optional()
    .or(z.literal("")),
  years_experience: z
    .number()
    .int("Experience must be a whole number")
    .min(0, "Experience cannot be negative")
    .max(70, "Experience cannot exceed 70 years")
    .optional()
    .or(z.literal(0)),
  bio: z
    .string()
    .trim()
    .max(1000, "Bio must be less than 1000 characters")
    .optional()
    .or(z.literal("")),
  headline: z
    .string()
    .trim()
    .max(150, "Headline must be less than 150 characters")
    .optional()
    .or(z.literal("")),
  location: z
    .string()
    .trim()
    .max(100, "Location must be less than 100 characters")
    .optional()
    .or(z.literal("")),
  phone: z
    .string()
    .trim()
    .max(20, "Phone must be less than 20 characters")
    .regex(/^[+\d\s\-()]*$/, "Phone contains invalid characters")
    .optional()
    .or(z.literal("")),
});

export type ProfileEditFormData = z.infer<typeof profileEditSchema>;

// Job application schema
export const jobApplicationSchema = z.object({
  cover_letter: z
    .string()
    .trim()
    .max(3000, "Cover letter must be less than 3000 characters")
    .optional()
    .or(z.literal("")),
});

export type JobApplicationFormData = z.infer<typeof jobApplicationSchema>;

// Helper function to sanitize tags
export const sanitizeTags = (tagsString: string): string[] => {
  return tagsString
    .split(",")
    .map((tag) => tag.trim().slice(0, 50))
    .filter((tag) => tag.length > 0 && /^[\w\s\-\.]+$/.test(tag))
    .slice(0, 10);
};

// Helper function to display validation errors
export const getValidationErrors = (
  error: z.ZodError
): { field: string; message: string }[] => {
  return error.errors.map((err) => ({
    field: err.path.join("."),
    message: err.message,
  }));
};
