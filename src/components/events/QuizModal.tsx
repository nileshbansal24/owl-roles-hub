import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useCandidateQuiz } from '@/hooks/useEvents';
import { Event } from '@/types/events';

interface QuizModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: Event;
}

const QuizModal = ({ open, onOpenChange, event }: QuizModalProps) => {
  const { questions, submission, loading, startQuiz, saveAnswer, submitQuiz } = useCandidateQuiz(event.id);
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [starting, setStarting] = useState(false);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);

  const currentQuestion = questions[currentIndex];
  const progress = questions.length > 0 ? ((currentIndex + 1) / questions.length) * 100 : 0;
  const totalPoints = questions.reduce((sum, q) => sum + q.points, 0);

  // Initialize answers from submission
  useEffect(() => {
    if (submission?.answers) {
      setAnswers(submission.answers);
    }
  }, [submission]);

  // Timer logic
  useEffect(() => {
    if (!submission || submission.submitted_at || !event.time_limit_minutes) return;

    const startTime = new Date(submission.started_at).getTime();
    const endTime = startTime + event.time_limit_minutes * 60 * 1000;

    const updateTimer = () => {
      const now = Date.now();
      const remaining = Math.max(0, Math.floor((endTime - now) / 1000));
      setTimeRemaining(remaining);

      if (remaining === 0) {
        handleSubmit();
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [submission, event.time_limit_minutes]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStart = async () => {
    setStarting(true);
    await startQuiz();
    setStarting(false);
  };

  const handleAnswerChange = async (answer: string) => {
    if (!currentQuestion) return;
    
    const newAnswers = { ...answers, [currentQuestion.id]: answer };
    setAnswers(newAnswers);
    await saveAnswer(currentQuestion.id, answer);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    await submitQuiz();
    setSubmitting(false);
    setShowSubmitDialog(false);
  };

  // Already submitted view
  if (submission?.submitted_at) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Quiz Completed
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="text-center space-y-2">
              <div className="text-4xl font-bold text-primary">
                {submission.score}/{submission.max_score}
              </div>
              <p className="text-muted-foreground">Points earned</p>
            </div>
            {submission.time_taken_seconds && (
              <div className="text-center text-sm text-muted-foreground">
                Completed in {Math.floor(submission.time_taken_seconds / 60)} minutes
              </div>
            )}
          </div>
          <Button onClick={() => onOpenChange(false)} className="w-full">
            Close
          </Button>
        </DialogContent>
      </Dialog>
    );
  }

  // Not started view
  if (!submission) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{event.title}</DialogTitle>
            <DialogDescription>{event.description}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="p-4 rounded-lg bg-muted">
                <div className="text-2xl font-bold">{questions.length}</div>
                <p className="text-sm text-muted-foreground">Questions</p>
              </div>
              <div className="p-4 rounded-lg bg-muted">
                <div className="text-2xl font-bold">{totalPoints}</div>
                <p className="text-sm text-muted-foreground">Total Points</p>
              </div>
            </div>
            {event.time_limit_minutes && (
              <div className="flex items-center justify-center gap-2 text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>{event.time_limit_minutes} minute time limit</span>
              </div>
            )}
            <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-yellow-500 shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-yellow-600">Important</p>
                  <p className="text-yellow-600/80">
                    Once you start, you cannot pause the quiz. Make sure you have enough time to complete it.
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleStart} disabled={starting || loading} className="flex-1">
              {starting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Start Quiz'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // In progress view
  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0 [&>button]:hidden">
        {/* Header */}
        <div className="p-4 border-b flex items-center justify-between">
          <div>
            <h2 className="font-semibold">{event.title}</h2>
            <p className="text-sm text-muted-foreground">
              Question {currentIndex + 1} of {questions.length}
            </p>
          </div>
          <div className="flex items-center gap-4">
            {timeRemaining !== null && (
              <Badge 
                variant={timeRemaining < 60 ? 'destructive' : 'secondary'}
                className="text-base px-3 py-1"
              >
                <Clock className="h-4 w-4 mr-1" />
                {formatTime(timeRemaining)}
              </Badge>
            )}
          </div>
        </div>

        {/* Progress */}
        <div className="px-4 py-2">
          <Progress value={progress} className="h-2" />
        </div>

        {/* Question */}
        <ScrollArea className="flex-1 p-6">
          {currentQuestion && (
            <motion.div
              key={currentQuestion.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline">{currentQuestion.points} point{currentQuestion.points !== 1 ? 's' : ''}</Badge>
                  <Badge variant="secondary">
                    {currentQuestion.question_type === 'mcq' ? 'Multiple Choice' : 'Short Answer'}
                  </Badge>
                </div>
                <h3 className="text-lg font-medium">{currentQuestion.question_text}</h3>
              </div>

              {currentQuestion.question_type === 'mcq' && currentQuestion.options && (
                <RadioGroup
                  value={answers[currentQuestion.id] || ''}
                  onValueChange={handleAnswerChange}
                >
                  <div className="space-y-3">
                    {(currentQuestion.options as string[]).map((option, idx) => (
                      <Card 
                        key={idx}
                        className={`cursor-pointer transition-colors ${
                          answers[currentQuestion.id] === idx.toString() 
                            ? 'border-primary bg-primary/5' 
                            : 'hover:border-primary/50'
                        }`}
                        onClick={() => handleAnswerChange(idx.toString())}
                      >
                        <CardContent className="p-4 flex items-center gap-3">
                          <RadioGroupItem value={idx.toString()} id={`option-${idx}`} />
                          <Label htmlFor={`option-${idx}`} className="flex-1 cursor-pointer">
                            {option}
                          </Label>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </RadioGroup>
              )}

              {currentQuestion.question_type === 'short_answer' && (
                <Textarea
                  value={answers[currentQuestion.id] || ''}
                  onChange={(e) => handleAnswerChange(e.target.value)}
                  placeholder="Type your answer here..."
                  rows={4}
                  className="resize-none"
                />
              )}
            </motion.div>
          )}
        </ScrollArea>

        {/* Navigation */}
        <div className="p-4 border-t flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
            disabled={currentIndex === 0}
          >
            Previous
          </Button>

          <div className="flex items-center gap-2">
            {questions.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`w-8 h-8 rounded-full text-sm font-medium transition-colors ${
                  idx === currentIndex
                    ? 'bg-primary text-primary-foreground'
                    : answers[questions[idx]?.id]
                    ? 'bg-green-500/20 text-green-600'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                {idx + 1}
              </button>
            ))}
          </div>

          {currentIndex === questions.length - 1 ? (
            <Button onClick={() => setShowSubmitDialog(true)}>
              Submit Quiz
            </Button>
          ) : (
            <Button
              onClick={() => setCurrentIndex(Math.min(questions.length - 1, currentIndex + 1))}
            >
              Next
            </Button>
          )}
        </div>

        {/* Submit Confirmation Dialog */}
        <AlertDialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Submit Quiz?</AlertDialogTitle>
              <AlertDialogDescription>
                You have answered {Object.keys(answers).length} of {questions.length} questions.
                {Object.keys(answers).length < questions.length && (
                  <span className="block mt-2 text-yellow-600">
                    Some questions are unanswered. Are you sure you want to submit?
                  </span>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Continue Quiz</AlertDialogCancel>
              <AlertDialogAction onClick={handleSubmit} disabled={submitting}>
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Submit'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DialogContent>
    </Dialog>
  );
};

export default QuizModal;
