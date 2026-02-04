// Events System Types

export type EventType = 'webinar' | 'quiz' | 'assignment';
export type EventStatus = 'draft' | 'published' | 'cancelled' | 'completed';
export type QuestionType = 'mcq' | 'short_answer';

export interface Event {
  id: string;
  recruiter_id: string;
  job_id: string;
  title: string;
  description: string | null;
  event_type: EventType;
  status: EventStatus;
  // Webinar specific
  meeting_link: string | null;
  platform: string | null; // 'google_meet', 'zoom', 'other'
  // Scheduling
  start_time: string | null;
  end_time: string | null;
  // Quiz specific
  time_limit_minutes: number | null;
  // Assignment specific
  submission_deadline: string | null;
  max_file_size_mb: number;
  allowed_file_types: string[];
  // Metadata
  created_at: string;
  updated_at: string;
  // Joined data
  jobs?: {
    title: string;
    institute: string;
  };
  questions_count?: number;
  registrations_count?: number;
  submissions_count?: number;
}

export interface EventQuestion {
  id: string;
  event_id: string;
  question_text: string;
  question_type: QuestionType;
  options: string[] | null; // For MCQ
  correct_answer: string | null;
  points: number;
  order_index: number;
  created_at: string;
}

export interface EventRegistration {
  id: string;
  event_id: string;
  candidate_id: string;
  status: 'registered' | 'attended' | 'cancelled';
  registered_at: string;
  attended_at: string | null;
  // Joined data
  profiles?: {
    full_name: string | null;
    email: string | null;
    avatar_url: string | null;
  };
}

export interface QuizSubmission {
  id: string;
  event_id: string;
  candidate_id: string;
  answers: Record<string, string>; // { question_id: answer }
  score: number | null;
  max_score: number | null;
  started_at: string;
  submitted_at: string | null;
  time_taken_seconds: number | null;
  graded_at: string | null;
  graded_by: string | null;
  // Joined data
  profiles?: {
    full_name: string | null;
    email: string | null;
    avatar_url: string | null;
  };
}

export interface AssignmentSubmission {
  id: string;
  event_id: string;
  candidate_id: string;
  file_url: string;
  file_name: string;
  file_size_bytes: number | null;
  submitted_at: string;
  score: number | null;
  max_score: number;
  feedback: string | null;
  graded_at: string | null;
  graded_by: string | null;
  // Joined data
  profiles?: {
    full_name: string | null;
    email: string | null;
    avatar_url: string | null;
  };
}

// Form types for creating/editing
export interface EventFormData {
  title: string;
  description: string;
  event_type: EventType;
  job_id: string;
  // Webinar fields
  meeting_link?: string;
  platform?: string;
  start_time?: Date;
  end_time?: Date;
  // Quiz fields
  time_limit_minutes?: number;
  // Assignment fields
  submission_deadline?: Date;
  max_file_size_mb?: number;
  allowed_file_types?: string[];
}

export interface QuestionFormData {
  question_text: string;
  question_type: QuestionType;
  options?: string[];
  correct_answer?: string;
  points: number;
}

// Helper functions
export const getEventTypeLabel = (type: EventType): string => {
  switch (type) {
    case 'webinar':
      return 'Webinar';
    case 'quiz':
      return 'Quiz';
    case 'assignment':
      return 'Assignment';
    default:
      return type;
  }
};

export const getEventTypeIcon = (type: EventType): string => {
  switch (type) {
    case 'webinar':
      return 'Video';
    case 'quiz':
      return 'HelpCircle';
    case 'assignment':
      return 'FileText';
    default:
      return 'Calendar';
  }
};

export const getEventStatusColor = (status: EventStatus): string => {
  switch (status) {
    case 'draft':
      return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/30';
    case 'published':
      return 'bg-green-500/10 text-green-600 border-green-500/30';
    case 'cancelled':
      return 'bg-red-500/10 text-red-600 border-red-500/30';
    case 'completed':
      return 'bg-blue-500/10 text-blue-600 border-blue-500/30';
    default:
      return 'bg-muted text-muted-foreground';
  }
};

export const getPlatformLabel = (platform: string | null): string => {
  switch (platform) {
    case 'google_meet':
      return 'Google Meet';
    case 'zoom':
      return 'Zoom';
    case 'other':
      return 'Other';
    default:
      return 'Unknown';
  }
};
