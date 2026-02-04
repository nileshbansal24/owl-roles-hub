import { useState } from 'react';
import { format } from 'date-fns';
import {
  Video,
  HelpCircle,
  FileText,
  Plus,
  Trash2,
  Users,
  Clock,
  Calendar,
  ExternalLink,
  Send,
  Loader2,
  GripVertical,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  useEventQuestions, 
  useEventRegistrations, 
  useEventSubmissions,
  useRecruiterEvents,
} from '@/hooks/useEvents';
import { Event, getEventStatusColor, getPlatformLabel, QuestionType } from '@/types/events';

interface EventDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: Event;
}

const EventDetailModal = ({ open, onOpenChange, event }: EventDetailModalProps) => {
  const { publishEvent } = useRecruiterEvents();
  const { questions, addQuestion, deleteQuestion, loading: questionsLoading } = useEventQuestions(event.id);
  const { registrations, loading: registrationsLoading } = useEventRegistrations(event.id);
  const { 
    quizSubmissions, 
    assignmentSubmissions, 
    gradeQuizSubmission,
    gradeAssignment,
    loading: submissionsLoading 
  } = useEventSubmissions(event.id, event.event_type as 'quiz' | 'assignment');

  const [activeTab, setActiveTab] = useState('details');
  const [publishing, setPublishing] = useState(false);
  
  // Question form state
  const [newQuestion, setNewQuestion] = useState('');
  const [questionType, setQuestionType] = useState<QuestionType>('mcq');
  const [options, setOptions] = useState(['', '', '', '']);
  const [correctAnswer, setCorrectAnswer] = useState('0');
  const [points, setPoints] = useState(1);
  const [addingQuestion, setAddingQuestion] = useState(false);

  // Grading state
  const [gradingId, setGradingId] = useState<string | null>(null);
  const [gradeScore, setGradeScore] = useState('');
  const [gradeFeedback, setGradeFeedback] = useState('');

  const handlePublish = async () => {
    setPublishing(true);
    await publishEvent(event.id);
    setPublishing(false);
  };

  const handleAddQuestion = async () => {
    if (!newQuestion.trim()) return;
    
    setAddingQuestion(true);
    const success = await addQuestion({
      question_text: newQuestion,
      question_type: questionType,
      options: questionType === 'mcq' ? options.filter(o => o.trim()) : undefined,
      correct_answer: questionType === 'mcq' ? correctAnswer : undefined,
      points,
    });

    if (success) {
      setNewQuestion('');
      setOptions(['', '', '', '']);
      setCorrectAnswer('0');
      setPoints(1);
    }
    setAddingQuestion(false);
  };

  const handleGradeQuiz = async (submissionId: string) => {
    const score = parseInt(gradeScore);
    if (isNaN(score)) return;
    
    await gradeQuizSubmission(submissionId, score);
    setGradingId(null);
    setGradeScore('');
  };

  const handleGradeAssignment = async (submissionId: string) => {
    const score = parseInt(gradeScore);
    if (isNaN(score)) return;
    
    await gradeAssignment(submissionId, score, gradeFeedback);
    setGradingId(null);
    setGradeScore('');
    setGradeFeedback('');
  };

  const getEventIcon = () => {
    switch (event.event_type) {
      case 'webinar':
        return <Video className="h-5 w-5 text-blue-500" />;
      case 'quiz':
        return <HelpCircle className="h-5 w-5 text-purple-500" />;
      case 'assignment':
        return <FileText className="h-5 w-5 text-orange-500" />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-0">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              {getEventIcon()}
              <div>
                <DialogTitle className="text-xl">{event.title}</DialogTitle>
                <p className="text-sm text-muted-foreground">
                  {event.jobs?.title} • {event.jobs?.institute}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={getEventStatusColor(event.status)}>
                {event.status}
              </Badge>
              {event.status === 'draft' && (
                <Button size="sm" onClick={handlePublish} disabled={publishing}>
                  {publishing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-1" />
                      Publish
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <div className="px-6">
            <TabsList className="w-full justify-start">
              <TabsTrigger value="details">Details</TabsTrigger>
              {event.event_type === 'quiz' && (
                <TabsTrigger value="questions">
                  Questions ({questions.length})
                </TabsTrigger>
              )}
              {event.event_type === 'webinar' && (
                <TabsTrigger value="registrations">
                  Registrations ({registrations.length})
                </TabsTrigger>
              )}
              {(event.event_type === 'quiz' || event.event_type === 'assignment') && (
                <TabsTrigger value="submissions">
                  Submissions ({event.event_type === 'quiz' ? quizSubmissions.length : assignmentSubmissions.length})
                </TabsTrigger>
              )}
            </TabsList>
          </div>

          <ScrollArea className="flex-1 p-6">
            {/* Details Tab */}
            <TabsContent value="details" className="mt-0 space-y-4">
              {event.description && (
                <div>
                  <Label className="text-muted-foreground">Description</Label>
                  <p className="mt-1">{event.description}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                {event.event_type === 'webinar' && (
                  <>
                    {event.platform && (
                      <div>
                        <Label className="text-muted-foreground">Platform</Label>
                        <p className="mt-1 flex items-center gap-2">
                          <Video className="h-4 w-4" />
                          {getPlatformLabel(event.platform)}
                        </p>
                      </div>
                    )}
                    {event.meeting_link && (
                      <div>
                        <Label className="text-muted-foreground">Meeting Link</Label>
                        <a 
                          href={event.meeting_link} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="mt-1 flex items-center gap-1 text-primary hover:underline"
                        >
                          Join Meeting
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    )}
                    {event.start_time && (
                      <div>
                        <Label className="text-muted-foreground">Start Time</Label>
                        <p className="mt-1 flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          {format(new Date(event.start_time), 'PPP p')}
                        </p>
                      </div>
                    )}
                    {event.end_time && (
                      <div>
                        <Label className="text-muted-foreground">End Time</Label>
                        <p className="mt-1 flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          {format(new Date(event.end_time), 'PPP p')}
                        </p>
                      </div>
                    )}
                  </>
                )}

                {event.event_type === 'quiz' && (
                  <>
                    {event.time_limit_minutes && (
                      <div>
                        <Label className="text-muted-foreground">Time Limit</Label>
                        <p className="mt-1 flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          {event.time_limit_minutes} minutes
                        </p>
                      </div>
                    )}
                    <div>
                      <Label className="text-muted-foreground">Questions</Label>
                      <p className="mt-1 flex items-center gap-2">
                        <HelpCircle className="h-4 w-4" />
                        {questions.length} questions
                      </p>
                    </div>
                  </>
                )}

                {event.event_type === 'assignment' && (
                  <>
                    {event.submission_deadline && (
                      <div>
                        <Label className="text-muted-foreground">Deadline</Label>
                        <p className="mt-1 flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          {format(new Date(event.submission_deadline), 'PPP')}
                        </p>
                      </div>
                    )}
                    <div>
                      <Label className="text-muted-foreground">Max File Size</Label>
                      <p className="mt-1">{event.max_file_size_mb} MB</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Allowed Types</Label>
                      <p className="mt-1">{event.allowed_file_types?.join(', ') || 'pdf, doc, docx'}</p>
                    </div>
                  </>
                )}
              </div>
            </TabsContent>

            {/* Questions Tab (Quiz only) */}
            <TabsContent value="questions" className="mt-0 space-y-4">
              {/* Add Question Form */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Add Question</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Question Type</Label>
                    <Select value={questionType} onValueChange={(v) => setQuestionType(v as QuestionType)}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mcq">Multiple Choice</SelectItem>
                        <SelectItem value="short_answer">Short Answer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Question</Label>
                    <Textarea
                      value={newQuestion}
                      onChange={(e) => setNewQuestion(e.target.value)}
                      placeholder="Enter your question..."
                      className="mt-1"
                    />
                  </div>

                  {questionType === 'mcq' && (
                    <div className="space-y-2">
                      <Label>Options</Label>
                      <RadioGroup value={correctAnswer} onValueChange={setCorrectAnswer}>
                        {options.map((opt, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <RadioGroupItem value={idx.toString()} id={`opt-${idx}`} />
                            <Input
                              value={opt}
                              onChange={(e) => {
                                const newOpts = [...options];
                                newOpts[idx] = e.target.value;
                                setOptions(newOpts);
                              }}
                              placeholder={`Option ${idx + 1}`}
                              className="flex-1"
                            />
                          </div>
                        ))}
                      </RadioGroup>
                      <p className="text-xs text-muted-foreground">Select the correct answer</p>
                    </div>
                  )}

                  <div className="flex items-end gap-4">
                    <div className="w-24">
                      <Label>Points</Label>
                      <Input
                        type="number"
                        min={1}
                        value={points}
                        onChange={(e) => setPoints(parseInt(e.target.value) || 1)}
                        className="mt-1"
                      />
                    </div>
                    <Button onClick={handleAddQuestion} disabled={addingQuestion || !newQuestion.trim()}>
                      {addingQuestion ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Plus className="h-4 w-4 mr-1" />
                          Add Question
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Questions List */}
              <div className="space-y-2">
                {questions.map((q, idx) => (
                  <Card key={q.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3 flex-1">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <GripVertical className="h-4 w-4" />
                            <span className="font-medium">{idx + 1}.</span>
                          </div>
                          <div className="flex-1">
                            <p className="font-medium">{q.question_text}</p>
                            {q.question_type === 'mcq' && q.options && (
                              <div className="mt-2 space-y-1">
                                {(q.options as string[]).map((opt, optIdx) => (
                                  <div key={optIdx} className="flex items-center gap-2 text-sm">
                                    {q.correct_answer === optIdx.toString() ? (
                                      <CheckCircle className="h-4 w-4 text-green-500" />
                                    ) : (
                                      <XCircle className="h-4 w-4 text-muted-foreground" />
                                    )}
                                    <span>{opt}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                            <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                              <Badge variant="secondary" className="text-xs">
                                {q.question_type === 'mcq' ? 'Multiple Choice' : 'Short Answer'}
                              </Badge>
                              <span>{q.points} point{q.points !== 1 ? 's' : ''}</span>
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => deleteQuestion(q.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Registrations Tab (Webinar only) */}
            <TabsContent value="registrations" className="mt-0">
              {registrations.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No registrations yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {registrations.map((reg) => (
                    <Card key={reg.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={reg.profiles?.avatar_url || ''} />
                            <AvatarFallback>
                              {reg.profiles?.full_name?.slice(0, 2) || '?'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <p className="font-medium">{reg.profiles?.full_name || 'Unknown'}</p>
                            <p className="text-sm text-muted-foreground">{reg.profiles?.email}</p>
                          </div>
                          <div className="text-right text-sm text-muted-foreground">
                            <Badge variant={reg.status === 'attended' ? 'default' : 'secondary'}>
                              {reg.status}
                            </Badge>
                            <p className="mt-1">
                              {format(new Date(reg.registered_at), 'PP')}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Submissions Tab */}
            <TabsContent value="submissions" className="mt-0">
              {event.event_type === 'quiz' && (
                quizSubmissions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No submissions yet</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {quizSubmissions.map((sub) => (
                      <Card key={sub.id}>
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarImage src={sub.profiles?.avatar_url || ''} />
                              <AvatarFallback>
                                {sub.profiles?.full_name?.slice(0, 2) || '?'}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <p className="font-medium">{sub.profiles?.full_name || 'Unknown'}</p>
                              <p className="text-sm text-muted-foreground">{sub.profiles?.email}</p>
                            </div>
                            <div className="text-right">
                              {sub.submitted_at ? (
                                <>
                                  {sub.score !== null ? (
                                    <Badge variant="default">
                                      {sub.score}/{sub.max_score} points
                                    </Badge>
                                  ) : gradingId === sub.id ? (
                                    <div className="flex items-center gap-2">
                                      <Input
                                        type="number"
                                        min={0}
                                        max={sub.max_score || 100}
                                        value={gradeScore}
                                        onChange={(e) => setGradeScore(e.target.value)}
                                        placeholder="Score"
                                        className="w-20"
                                      />
                                      <Button size="sm" onClick={() => handleGradeQuiz(sub.id)}>
                                        Save
                                      </Button>
                                    </div>
                                  ) : (
                                    <Button size="sm" variant="outline" onClick={() => setGradingId(sub.id)}>
                                      Grade
                                    </Button>
                                  )}
                                  <p className="text-xs text-muted-foreground mt-1">
                                    Submitted {format(new Date(sub.submitted_at), 'PP')}
                                  </p>
                                </>
                              ) : (
                                <Badge variant="secondary">In Progress</Badge>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )
              )}

              {event.event_type === 'assignment' && (
                assignmentSubmissions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No submissions yet</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {assignmentSubmissions.map((sub) => (
                      <Card key={sub.id}>
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <Avatar>
                              <AvatarImage src={sub.profiles?.avatar_url || ''} />
                              <AvatarFallback>
                                {sub.profiles?.full_name?.slice(0, 2) || '?'}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <p className="font-medium">{sub.profiles?.full_name || 'Unknown'}</p>
                              <p className="text-sm text-muted-foreground">{sub.profiles?.email}</p>
                              <p className="text-sm text-primary mt-1">{sub.file_name}</p>
                            </div>
                            <div className="text-right">
                              {sub.score !== null ? (
                                <Badge variant="default">
                                  {sub.score}/{sub.max_score} points
                                </Badge>
                              ) : gradingId === sub.id ? (
                                <div className="space-y-2">
                                  <Input
                                    type="number"
                                    min={0}
                                    max={sub.max_score}
                                    value={gradeScore}
                                    onChange={(e) => setGradeScore(e.target.value)}
                                    placeholder="Score"
                                    className="w-full"
                                  />
                                  <Textarea
                                    value={gradeFeedback}
                                    onChange={(e) => setGradeFeedback(e.target.value)}
                                    placeholder="Feedback..."
                                    rows={2}
                                  />
                                  <Button size="sm" className="w-full" onClick={() => handleGradeAssignment(sub.id)}>
                                    Save Grade
                                  </Button>
                                </div>
                              ) : (
                                <Button size="sm" variant="outline" onClick={() => setGradingId(sub.id)}>
                                  Grade
                                </Button>
                              )}
                              <p className="text-xs text-muted-foreground mt-1">
                                {format(new Date(sub.submitted_at), 'PP')}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )
              )}
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default EventDetailModal;
