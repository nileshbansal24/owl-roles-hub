export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      candidate_rankings: {
        Row: {
          created_at: string
          id: string
          job_id: string
          notes: string | null
          rankings: Json
          recruiter_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          job_id: string
          notes?: string | null
          rankings?: Json
          recruiter_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          job_id?: string
          notes?: string | null
          rankings?: Json
          recruiter_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "candidate_rankings_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "candidate_rankings_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs_public"
            referencedColumns: ["id"]
          },
        ]
      }
      institution_verifications: {
        Row: {
          created_at: string
          id: string
          recruiter_id: string
          status: string
          updated_at: string
          verification_notes: string | null
          verified_at: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          recruiter_id: string
          status?: string
          updated_at?: string
          verification_notes?: string | null
          verified_at?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          recruiter_id?: string
          status?: string
          updated_at?: string
          verification_notes?: string | null
          verified_at?: string | null
        }
        Relationships: []
      }
      interviews: {
        Row: {
          application_id: string
          candidate_id: string
          confirmed_time: string | null
          created_at: string
          id: string
          interview_type: string | null
          job_id: string
          location: string | null
          meeting_link: string | null
          notes: string | null
          proposed_times: Json
          recruiter_id: string
          recruiter_notes: string | null
          status: string
          updated_at: string
        }
        Insert: {
          application_id: string
          candidate_id: string
          confirmed_time?: string | null
          created_at?: string
          id?: string
          interview_type?: string | null
          job_id: string
          location?: string | null
          meeting_link?: string | null
          notes?: string | null
          proposed_times?: Json
          recruiter_id: string
          recruiter_notes?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          application_id?: string
          candidate_id?: string
          confirmed_time?: string | null
          created_at?: string
          id?: string
          interview_type?: string | null
          job_id?: string
          location?: string | null
          meeting_link?: string | null
          notes?: string | null
          proposed_times?: Json
          recruiter_id?: string
          recruiter_notes?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "interviews_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "job_applications"
            referencedColumns: ["id"]
          },
        ]
      }
      job_applications: {
        Row: {
          applicant_email: string | null
          applicant_id: string
          cover_letter: string | null
          created_at: string
          id: string
          job_id: string
          resume_url: string | null
          status: string
          updated_at: string
        }
        Insert: {
          applicant_email?: string | null
          applicant_id: string
          cover_letter?: string | null
          created_at?: string
          id?: string
          job_id: string
          resume_url?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          applicant_email?: string | null
          applicant_id?: string
          cover_letter?: string | null
          created_at?: string
          id?: string
          job_id?: string
          resume_url?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_applications_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_applications_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs_public"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          id: string
          institute: string
          job_type: string | null
          location: string
          salary_range: string | null
          tags: string[] | null
          title: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          institute: string
          job_type?: string | null
          location: string
          salary_range?: string | null
          tags?: string[] | null
          title: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          institute?: string
          job_type?: string | null
          location?: string
          salary_range?: string | null
          tags?: string[] | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "jobs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          achievements: string[] | null
          avatar_url: string | null
          bio: string | null
          created_at: string
          education: Json | null
          email: string | null
          experience: Json | null
          family_details: string | null
          full_name: string | null
          headline: string | null
          hobbies: string[] | null
          id: string
          linkedin_url: string | null
          location: string | null
          manual_h_index: number | null
          orcid_id: string | null
          phone: string | null
          professional_summary: string | null
          quotes: string | null
          recommended_books: string[] | null
          research_papers: Json | null
          resume_url: string | null
          role: string | null
          scopus_link: string | null
          scopus_metrics: Json | null
          skills: string[] | null
          subjects: string[] | null
          teaching_philosophy: string | null
          university: string | null
          updated_at: string
          user_type: string | null
          years_experience: number | null
        }
        Insert: {
          achievements?: string[] | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          education?: Json | null
          email?: string | null
          experience?: Json | null
          family_details?: string | null
          full_name?: string | null
          headline?: string | null
          hobbies?: string[] | null
          id: string
          linkedin_url?: string | null
          location?: string | null
          manual_h_index?: number | null
          orcid_id?: string | null
          phone?: string | null
          professional_summary?: string | null
          quotes?: string | null
          recommended_books?: string[] | null
          research_papers?: Json | null
          resume_url?: string | null
          role?: string | null
          scopus_link?: string | null
          scopus_metrics?: Json | null
          skills?: string[] | null
          subjects?: string[] | null
          teaching_philosophy?: string | null
          university?: string | null
          updated_at?: string
          user_type?: string | null
          years_experience?: number | null
        }
        Update: {
          achievements?: string[] | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          education?: Json | null
          email?: string | null
          experience?: Json | null
          family_details?: string | null
          full_name?: string | null
          headline?: string | null
          hobbies?: string[] | null
          id?: string
          linkedin_url?: string | null
          location?: string | null
          manual_h_index?: number | null
          orcid_id?: string | null
          phone?: string | null
          professional_summary?: string | null
          quotes?: string | null
          recommended_books?: string[] | null
          research_papers?: Json | null
          resume_url?: string | null
          role?: string | null
          scopus_link?: string | null
          scopus_metrics?: Json | null
          skills?: string[] | null
          subjects?: string[] | null
          teaching_philosophy?: string | null
          university?: string | null
          updated_at?: string
          user_type?: string | null
          years_experience?: number | null
        }
        Relationships: []
      }
      recruiter_messages: {
        Row: {
          candidate_email: string
          candidate_id: string
          candidate_name: string
          click_count: number
          created_at: string
          id: string
          job_id: string | null
          job_title: string | null
          last_clicked_at: string | null
          message: string
          open_count: number
          opened_at: string | null
          recruiter_id: string
          status: string
          subject: string
          updated_at: string
        }
        Insert: {
          candidate_email: string
          candidate_id: string
          candidate_name: string
          click_count?: number
          created_at?: string
          id?: string
          job_id?: string | null
          job_title?: string | null
          last_clicked_at?: string | null
          message: string
          open_count?: number
          opened_at?: string | null
          recruiter_id: string
          status?: string
          subject: string
          updated_at?: string
        }
        Update: {
          candidate_email?: string
          candidate_id?: string
          candidate_name?: string
          click_count?: number
          created_at?: string
          id?: string
          job_id?: string | null
          job_title?: string | null
          last_clicked_at?: string | null
          message?: string
          open_count?: number
          opened_at?: string | null
          recruiter_id?: string
          status?: string
          subject?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "recruiter_messages_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recruiter_messages_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs_public"
            referencedColumns: ["id"]
          },
        ]
      }
      recruiter_notes: {
        Row: {
          applicant_id: string
          application_id: string
          created_at: string
          id: string
          note: string
          recruiter_id: string
          updated_at: string
        }
        Insert: {
          applicant_id: string
          application_id: string
          created_at?: string
          id?: string
          note: string
          recruiter_id: string
          updated_at?: string
        }
        Update: {
          applicant_id?: string
          application_id?: string
          created_at?: string
          id?: string
          note?: string
          recruiter_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "recruiter_notes_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "job_applications"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_candidates: {
        Row: {
          candidate_id: string
          created_at: string
          id: string
          notes: string | null
          recruiter_id: string
        }
        Insert: {
          candidate_id: string
          created_at?: string
          id?: string
          notes?: string | null
          recruiter_id: string
        }
        Update: {
          candidate_id?: string
          created_at?: string
          id?: string
          notes?: string | null
          recruiter_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_candidates_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saved_candidates_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      jobs_public: {
        Row: {
          created_at: string | null
          description: string | null
          id: string | null
          institute: string | null
          job_type: string | null
          location: string | null
          salary_range: string | null
          tags: string[] | null
          title: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string | null
          institute?: string | null
          job_type?: string | null
          location?: string | null
          salary_range?: string | null
          tags?: string[] | null
          title?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string | null
          institute?: string | null
          job_type?: string | null
          location?: string | null
          salary_range?: string | null
          tags?: string[] | null
          title?: string | null
        }
        Relationships: []
      }
      profiles_public: {
        Row: {
          avatar_url: string | null
          bio: string | null
          email: string | null
          full_name: string | null
          headline: string | null
          id: string | null
          location: string | null
          professional_summary: string | null
          role: string | null
          skills: string[] | null
          university: string | null
          updated_at: string | null
          user_type: string | null
          years_experience: number | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          email?: string | null
          full_name?: string | null
          headline?: string | null
          id?: string | null
          location?: string | null
          professional_summary?: string | null
          role?: string | null
          skills?: string[] | null
          university?: string | null
          updated_at?: string | null
          user_type?: string | null
          years_experience?: number | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          email?: string | null
          full_name?: string | null
          headline?: string | null
          id?: string | null
          location?: string | null
          professional_summary?: string | null
          role?: string | null
          skills?: string[] | null
          university?: string | null
          updated_at?: string | null
          user_type?: string | null
          years_experience?: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      is_recruiter: { Args: { _user_id: string }; Returns: boolean }
      is_verified_recruiter: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
