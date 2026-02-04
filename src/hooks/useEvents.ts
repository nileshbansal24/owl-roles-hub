import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import type { 
  Event, 
  EventQuestion, 
  EventRegistration, 
  QuizSubmission, 
  AssignmentSubmission,
  EventFormData,
  QuestionFormData
} from '@/types/events';

export const useRecruiterEvents = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEvents = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('events')
        .select(`
          *,
          jobs(title, institute)
        `)
        .eq('recruiter_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Get counts for each event
      const enrichedEvents = await Promise.all(
        (data || []).map(async (event) => {
          const [questionsResult, registrationsResult, quizSubsResult, assignSubsResult] = await Promise.all([
            supabase.from('event_questions').select('id', { count: 'exact', head: true }).eq('event_id', event.id),
            supabase.from('event_registrations').select('id', { count: 'exact', head: true }).eq('event_id', event.id),
            supabase.from('quiz_submissions').select('id', { count: 'exact', head: true }).eq('event_id', event.id),
            supabase.from('assignment_submissions').select('id', { count: 'exact', head: true }).eq('event_id', event.id),
          ]);
          
          return {
            ...event,
            questions_count: questionsResult.count || 0,
            registrations_count: registrationsResult.count || 0,
            submissions_count: (quizSubsResult.count || 0) + (assignSubsResult.count || 0),
          } as Event;
        })
      );
      
      setEvents(enrichedEvents);
    } catch (error: any) {
      console.error('Error fetching events:', error);
      toast({
        title: 'Error',
        description: 'Failed to load events',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const createEvent = async (data: EventFormData): Promise<Event | null> => {
    if (!user) return null;
    
    try {
      const insertData: any = {
        recruiter_id: user.id,
        job_id: data.job_id,
        title: data.title,
        description: data.description || null,
        event_type: data.event_type,
        status: 'draft',
      };

      if (data.event_type === 'webinar') {
        insertData.meeting_link = data.meeting_link || null;
        insertData.platform = data.platform || null;
        insertData.start_time = data.start_time?.toISOString() || null;
        insertData.end_time = data.end_time?.toISOString() || null;
      } else if (data.event_type === 'quiz') {
        insertData.time_limit_minutes = data.time_limit_minutes || null;
        insertData.start_time = data.start_time?.toISOString() || null;
        insertData.end_time = data.end_time?.toISOString() || null;
      } else if (data.event_type === 'assignment') {
        insertData.submission_deadline = data.submission_deadline?.toISOString() || null;
        insertData.max_file_size_mb = data.max_file_size_mb || 10;
        insertData.allowed_file_types = data.allowed_file_types || ['pdf', 'doc', 'docx'];
      }

      const { data: event, error } = await supabase
        .from('events')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;

      await fetchEvents();
      toast({ title: 'Event created', description: 'Your event has been created as a draft.' });
      return event as Event;
    } catch (error: any) {
      console.error('Error creating event:', error);
      toast({ title: 'Error', description: error.message || 'Failed to create event', variant: 'destructive' });
      return null;
    }
  };

  const updateEvent = async (eventId: string, data: Partial<EventFormData>): Promise<boolean> => {
    try {
      const updateData: any = {};
      
      if (data.title !== undefined) updateData.title = data.title;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.meeting_link !== undefined) updateData.meeting_link = data.meeting_link;
      if (data.platform !== undefined) updateData.platform = data.platform;
      if (data.start_time !== undefined) updateData.start_time = data.start_time?.toISOString();
      if (data.end_time !== undefined) updateData.end_time = data.end_time?.toISOString();
      if (data.time_limit_minutes !== undefined) updateData.time_limit_minutes = data.time_limit_minutes;
      if (data.submission_deadline !== undefined) updateData.submission_deadline = data.submission_deadline?.toISOString();
      if (data.max_file_size_mb !== undefined) updateData.max_file_size_mb = data.max_file_size_mb;
      if (data.allowed_file_types !== undefined) updateData.allowed_file_types = data.allowed_file_types;

      const { error } = await supabase
        .from('events')
        .update(updateData)
        .eq('id', eventId);

      if (error) throw error;

      await fetchEvents();
      toast({ title: 'Event updated', description: 'Your changes have been saved.' });
      return true;
    } catch (error: any) {
      console.error('Error updating event:', error);
      toast({ title: 'Error', description: error.message || 'Failed to update event', variant: 'destructive' });
      return false;
    }
  };

  const publishEvent = async (eventId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('events')
        .update({ status: 'published' })
        .eq('id', eventId);

      if (error) throw error;

      await fetchEvents();
      toast({ title: 'Event published', description: 'Candidates can now see this event.' });
      return true;
    } catch (error: any) {
      console.error('Error publishing event:', error);
      toast({ title: 'Error', description: error.message || 'Failed to publish event', variant: 'destructive' });
      return false;
    }
  };

  const deleteEvent = async (eventId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', eventId);

      if (error) throw error;

      await fetchEvents();
      toast({ title: 'Event deleted', description: 'The event has been removed.' });
      return true;
    } catch (error: any) {
      console.error('Error deleting event:', error);
      toast({ title: 'Error', description: error.message || 'Failed to delete event', variant: 'destructive' });
      return false;
    }
  };

  return {
    events,
    loading,
    fetchEvents,
    createEvent,
    updateEvent,
    publishEvent,
    deleteEvent,
  };
};

export const useEventQuestions = (eventId: string | null) => {
  const { toast } = useToast();
  const [questions, setQuestions] = useState<EventQuestion[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchQuestions = useCallback(async () => {
    if (!eventId) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('event_questions')
        .select('*')
        .eq('event_id', eventId)
        .order('order_index', { ascending: true });

      if (error) throw error;
      setQuestions((data || []) as EventQuestion[]);
    } catch (error: any) {
      console.error('Error fetching questions:', error);
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  const addQuestion = async (data: QuestionFormData): Promise<boolean> => {
    if (!eventId) return false;
    
    try {
      const maxOrder = questions.reduce((max, q) => Math.max(max, q.order_index), -1);
      
      const { error } = await supabase
        .from('event_questions')
        .insert({
          event_id: eventId,
          question_text: data.question_text,
          question_type: data.question_type,
          options: data.options || null,
          correct_answer: data.correct_answer || null,
          points: data.points,
          order_index: maxOrder + 1,
        });

      if (error) throw error;

      await fetchQuestions();
      toast({ title: 'Question added' });
      return true;
    } catch (error: any) {
      console.error('Error adding question:', error);
      toast({ title: 'Error', description: error.message || 'Failed to add question', variant: 'destructive' });
      return false;
    }
  };

  const updateQuestion = async (questionId: string, data: Partial<QuestionFormData>): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('event_questions')
        .update({
          question_text: data.question_text,
          question_type: data.question_type,
          options: data.options,
          correct_answer: data.correct_answer,
          points: data.points,
        })
        .eq('id', questionId);

      if (error) throw error;

      await fetchQuestions();
      return true;
    } catch (error: any) {
      console.error('Error updating question:', error);
      toast({ title: 'Error', description: error.message || 'Failed to update question', variant: 'destructive' });
      return false;
    }
  };

  const deleteQuestion = async (questionId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('event_questions')
        .delete()
        .eq('id', questionId);

      if (error) throw error;

      await fetchQuestions();
      toast({ title: 'Question deleted' });
      return true;
    } catch (error: any) {
      console.error('Error deleting question:', error);
      toast({ title: 'Error', description: error.message || 'Failed to delete question', variant: 'destructive' });
      return false;
    }
  };

  const reorderQuestions = async (orderedIds: string[]): Promise<boolean> => {
    try {
      await Promise.all(
        orderedIds.map((id, index) =>
          supabase.from('event_questions').update({ order_index: index }).eq('id', id)
        )
      );
      await fetchQuestions();
      return true;
    } catch (error: any) {
      console.error('Error reordering questions:', error);
      return false;
    }
  };

  return {
    questions,
    loading,
    fetchQuestions,
    addQuestion,
    updateQuestion,
    deleteQuestion,
    reorderQuestions,
  };
};

export const useEventRegistrations = (eventId: string | null) => {
  const [registrations, setRegistrations] = useState<EventRegistration[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchRegistrations = useCallback(async () => {
    if (!eventId) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('event_registrations')
        .select('*')
        .eq('event_id', eventId)
        .order('registered_at', { ascending: false });

      if (error) throw error;
      
      // Fetch profiles separately
      const enrichedData = await Promise.all(
        (data || []).map(async (reg) => {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('full_name, email, avatar_url')
            .eq('id', reg.candidate_id)
            .maybeSingle();
          return { ...reg, profiles: profileData } as EventRegistration;
        })
      );
      
      setRegistrations(enrichedData);
    } catch (error: any) {
      console.error('Error fetching registrations:', error);
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    fetchRegistrations();
  }, [fetchRegistrations]);

  return { registrations, loading, fetchRegistrations };
};

export const useEventSubmissions = (eventId: string | null, eventType: 'quiz' | 'assignment' | null) => {
  const { toast } = useToast();
  const [quizSubmissions, setQuizSubmissions] = useState<QuizSubmission[]>([]);
  const [assignmentSubmissions, setAssignmentSubmissions] = useState<AssignmentSubmission[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchSubmissions = useCallback(async () => {
    if (!eventId || !eventType) return;
    
    setLoading(true);
    try {
      if (eventType === 'quiz') {
        const { data, error } = await supabase
          .from('quiz_submissions')
          .select('*')
          .eq('event_id', eventId)
          .order('submitted_at', { ascending: false });

        if (error) throw error;
        
        // Fetch profiles separately
        const enrichedData = await Promise.all(
          (data || []).map(async (sub) => {
            const { data: profileData } = await supabase
              .from('profiles')
              .select('full_name, email, avatar_url')
              .eq('id', sub.candidate_id)
              .maybeSingle();
            return { ...sub, profiles: profileData } as QuizSubmission;
          })
        );
        
        setQuizSubmissions(enrichedData);
      } else {
        const { data, error } = await supabase
          .from('assignment_submissions')
          .select('*')
          .eq('event_id', eventId)
          .order('submitted_at', { ascending: false });

        if (error) throw error;
        
        // Fetch profiles separately
        const enrichedData = await Promise.all(
          (data || []).map(async (sub) => {
            const { data: profileData } = await supabase
              .from('profiles')
              .select('full_name, email, avatar_url')
              .eq('id', sub.candidate_id)
              .maybeSingle();
            return { ...sub, profiles: profileData } as AssignmentSubmission;
          })
        );
        
        setAssignmentSubmissions(enrichedData);
      }
    } catch (error: any) {
      console.error('Error fetching submissions:', error);
    } finally {
      setLoading(false);
    }
  }, [eventId, eventType]);

  useEffect(() => {
    fetchSubmissions();
  }, [fetchSubmissions]);

  const gradeQuizSubmission = async (submissionId: string, score: number): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('quiz_submissions')
        .update({
          score,
          graded_at: new Date().toISOString(),
          graded_by: (await supabase.auth.getUser()).data.user?.id,
        })
        .eq('id', submissionId);

      if (error) throw error;

      await fetchSubmissions();
      toast({ title: 'Quiz graded' });
      return true;
    } catch (error: any) {
      console.error('Error grading quiz:', error);
      toast({ title: 'Error', description: error.message || 'Failed to grade quiz', variant: 'destructive' });
      return false;
    }
  };

  const gradeAssignment = async (submissionId: string, score: number, feedback: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('assignment_submissions')
        .update({
          score,
          feedback,
          graded_at: new Date().toISOString(),
          graded_by: (await supabase.auth.getUser()).data.user?.id,
        })
        .eq('id', submissionId);

      if (error) throw error;

      await fetchSubmissions();
      toast({ title: 'Assignment graded' });
      return true;
    } catch (error: any) {
      console.error('Error grading assignment:', error);
      toast({ title: 'Error', description: error.message || 'Failed to grade assignment', variant: 'destructive' });
      return false;
    }
  };

  return {
    quizSubmissions,
    assignmentSubmissions,
    loading,
    fetchSubmissions,
    gradeQuizSubmission,
    gradeAssignment,
  };
};

// Candidate-side hooks
export const useCandidateEvents = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEvents = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('events')
        .select(`
          *,
          jobs(title, institute)
        `)
        .eq('status', 'published')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEvents((data || []) as Event[]);
    } catch (error: any) {
      console.error('Error fetching events:', error);
      toast({
        title: 'Error',
        description: 'Failed to load events',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const registerForWebinar = async (eventId: string): Promise<boolean> => {
    if (!user) return false;
    
    try {
      const { error } = await supabase
        .from('event_registrations')
        .insert({
          event_id: eventId,
          candidate_id: user.id,
          status: 'registered',
        });

      if (error) throw error;

      toast({ title: 'Registered!', description: 'You have been registered for this webinar.' });
      return true;
    } catch (error: any) {
      console.error('Error registering:', error);
      toast({ title: 'Error', description: error.message || 'Failed to register', variant: 'destructive' });
      return false;
    }
  };

  const getMyRegistration = async (eventId: string): Promise<EventRegistration | null> => {
    if (!user) return null;
    
    try {
      const { data, error } = await supabase
        .from('event_registrations')
        .select('*')
        .eq('event_id', eventId)
        .eq('candidate_id', user.id)
        .maybeSingle();

      if (error) throw error;
      return data as EventRegistration | null;
    } catch (error) {
      return null;
    }
  };

  return {
    events,
    loading,
    fetchEvents,
    registerForWebinar,
    getMyRegistration,
  };
};

export const useCandidateQuiz = (eventId: string | null) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [questions, setQuestions] = useState<EventQuestion[]>([]);
  const [submission, setSubmission] = useState<QuizSubmission | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchQuizData = useCallback(async () => {
    if (!eventId || !user) return;
    
    setLoading(true);
    try {
      // Get questions (without correct answers for candidates)
      const { data: questionsData, error: questionsError } = await supabase
        .from('event_questions')
        .select('id, event_id, question_text, question_type, options, points, order_index')
        .eq('event_id', eventId)
        .order('order_index', { ascending: true });

      if (questionsError) throw questionsError;
      setQuestions((questionsData || []) as EventQuestion[]);

      // Get existing submission
      const { data: submissionData, error: submissionError } = await supabase
        .from('quiz_submissions')
        .select('*')
        .eq('event_id', eventId)
        .eq('candidate_id', user.id)
        .maybeSingle();

      if (submissionError && submissionError.code !== 'PGRST116') throw submissionError;
      setSubmission(submissionData as QuizSubmission | null);
    } catch (error: any) {
      console.error('Error fetching quiz data:', error);
    } finally {
      setLoading(false);
    }
  }, [eventId, user]);

  useEffect(() => {
    fetchQuizData();
  }, [fetchQuizData]);

  const startQuiz = async (): Promise<boolean> => {
    if (!eventId || !user) return false;
    
    try {
      const { data, error } = await supabase
        .from('quiz_submissions')
        .insert({
          event_id: eventId,
          candidate_id: user.id,
          answers: {},
        })
        .select()
        .single();

      if (error) throw error;
      setSubmission(data as QuizSubmission);
      return true;
    } catch (error: any) {
      console.error('Error starting quiz:', error);
      toast({ title: 'Error', description: error.message || 'Failed to start quiz', variant: 'destructive' });
      return false;
    }
  };

  const saveAnswer = async (questionId: string, answer: string): Promise<boolean> => {
    if (!submission) return false;
    
    try {
      const newAnswers = { ...submission.answers, [questionId]: answer };
      
      const { error } = await supabase
        .from('quiz_submissions')
        .update({ answers: newAnswers })
        .eq('id', submission.id);

      if (error) throw error;
      setSubmission({ ...submission, answers: newAnswers });
      return true;
    } catch (error: any) {
      console.error('Error saving answer:', error);
      return false;
    }
  };

  const submitQuiz = async (): Promise<boolean> => {
    if (!submission) return false;
    
    try {
      const timeTaken = Math.floor((Date.now() - new Date(submission.started_at).getTime()) / 1000);
      const maxScore = questions.reduce((sum, q) => sum + q.points, 0);
      
      // Calculate score for MCQ questions
      let score = 0;
      for (const question of questions) {
        if (question.question_type === 'mcq' && question.correct_answer) {
          const answer = submission.answers[question.id];
          if (answer === question.correct_answer) {
            score += question.points;
          }
        }
      }

      const { error } = await supabase
        .from('quiz_submissions')
        .update({
          submitted_at: new Date().toISOString(),
          time_taken_seconds: timeTaken,
          score,
          max_score: maxScore,
        })
        .eq('id', submission.id);

      if (error) throw error;
      
      await fetchQuizData();
      toast({ title: 'Quiz submitted!', description: 'Your answers have been recorded.' });
      return true;
    } catch (error: any) {
      console.error('Error submitting quiz:', error);
      toast({ title: 'Error', description: error.message || 'Failed to submit quiz', variant: 'destructive' });
      return false;
    }
  };

  return {
    questions,
    submission,
    loading,
    startQuiz,
    saveAnswer,
    submitQuiz,
  };
};

export const useCandidateAssignment = (eventId: string | null) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [submission, setSubmission] = useState<AssignmentSubmission | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const fetchSubmission = useCallback(async () => {
    if (!eventId || !user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('assignment_submissions')
        .select('*')
        .eq('event_id', eventId)
        .eq('candidate_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      setSubmission(data as AssignmentSubmission | null);
    } catch (error: any) {
      console.error('Error fetching submission:', error);
    } finally {
      setLoading(false);
    }
  }, [eventId, user]);

  useEffect(() => {
    fetchSubmission();
  }, [fetchSubmission]);

  const submitAssignment = async (file: File): Promise<boolean> => {
    if (!eventId || !user) return false;
    
    setUploading(true);
    try {
      // Upload file to storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${eventId}_${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('assignments')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Create submission record
      const { error: insertError } = await supabase
        .from('assignment_submissions')
        .insert({
          event_id: eventId,
          candidate_id: user.id,
          file_url: filePath,
          file_name: file.name,
          file_size_bytes: file.size,
        });

      if (insertError) throw insertError;

      await fetchSubmission();
      toast({ title: 'Assignment submitted!', description: 'Your file has been uploaded successfully.' });
      return true;
    } catch (error: any) {
      console.error('Error submitting assignment:', error);
      toast({ title: 'Error', description: error.message || 'Failed to submit assignment', variant: 'destructive' });
      return false;
    } finally {
      setUploading(false);
    }
  };

  return {
    submission,
    loading,
    uploading,
    submitAssignment,
  };
};
