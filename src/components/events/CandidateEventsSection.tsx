import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { format, isPast, isFuture } from 'date-fns';
import {
  Video,
  HelpCircle,
  FileText,
  Calendar,
  Clock,
  ExternalLink,
  CheckCircle,
  Play,
  Upload,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProfileCard } from '@/components/profile';
import { useCandidateEvents } from '@/hooks/useEvents';
import { Event, getEventTypeLabel, getPlatformLabel } from '@/types/events';
import QuizModal from './QuizModal';
import AssignmentModal from './AssignmentModal';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const CandidateEventsSection = () => {
  const { events, loading, registerForWebinar, getMyRegistration } = useCandidateEvents();
  const [activeFilter, setActiveFilter] = useState<'all' | 'webinar' | 'quiz' | 'assignment'>('all');
  const [registrations, setRegistrations] = useState<Record<string, boolean>>({});
  const [registeringId, setRegisteringId] = useState<string | null>(null);
  const [selectedQuizEvent, setSelectedQuizEvent] = useState<Event | null>(null);
  const [selectedAssignmentEvent, setSelectedAssignmentEvent] = useState<Event | null>(null);

  const filteredEvents = events.filter(event => 
    activeFilter === 'all' || event.event_type === activeFilter
  );

  // Check registration status for all webinars
  useEffect(() => {
    const checkRegistrations = async () => {
      const webinars = events.filter(e => e.event_type === 'webinar');
      const regs: Record<string, boolean> = {};
      
      for (const webinar of webinars) {
        const reg = await getMyRegistration(webinar.id);
        regs[webinar.id] = !!reg;
      }
      
      setRegistrations(regs);
    };
    
    if (events.length > 0) {
      checkRegistrations();
    }
  }, [events, getMyRegistration]);

  const handleRegister = async (eventId: string) => {
    setRegisteringId(eventId);
    const success = await registerForWebinar(eventId);
    if (success) {
      setRegistrations(prev => ({ ...prev, [eventId]: true }));
    }
    setRegisteringId(null);
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'webinar':
        return <Video className="h-5 w-5 text-blue-500" />;
      case 'quiz':
        return <HelpCircle className="h-5 w-5 text-purple-500" />;
      case 'assignment':
        return <FileText className="h-5 w-5 text-orange-500" />;
      default:
        return <Calendar className="h-5 w-5" />;
    }
  };

  const getEventStatus = (event: Event) => {
    if (event.event_type === 'webinar' && event.start_time) {
      if (isPast(new Date(event.end_time || event.start_time))) {
        return { label: 'Ended', variant: 'secondary' as const };
      }
      if (isFuture(new Date(event.start_time))) {
        return { label: 'Upcoming', variant: 'default' as const };
      }
      return { label: 'Live Now', variant: 'destructive' as const };
    }
    if (event.event_type === 'assignment' && event.submission_deadline) {
      if (isPast(new Date(event.submission_deadline))) {
        return { label: 'Deadline Passed', variant: 'secondary' as const };
      }
    }
    if (event.event_type === 'quiz' && event.end_time) {
      if (isPast(new Date(event.end_time))) {
        return { label: 'Closed', variant: 'secondary' as const };
      }
    }
    return { label: 'Open', variant: 'default' as const };
  };

  if (loading) {
    return (
      <ProfileCard title="Events">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </ProfileCard>
    );
  }

  if (events.length === 0) {
    return (
      <ProfileCard title="Events">
        <div className="text-center py-8">
          <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground mb-2">No events available</p>
          <p className="text-sm text-muted-foreground">
            Events from jobs you've applied to will appear here
          </p>
        </div>
      </ProfileCard>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Events</h2>
        <p className="text-muted-foreground">
          Webinars, quizzes, and assignments from your job applications
        </p>
      </div>

      {/* Filter Tabs */}
      <Tabs value={activeFilter} onValueChange={(v) => setActiveFilter(v as any)}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="webinar" className="gap-1.5">
            <Video className="h-4 w-4" />
            Webinars
          </TabsTrigger>
          <TabsTrigger value="quiz" className="gap-1.5">
            <HelpCircle className="h-4 w-4" />
            Quizzes
          </TabsTrigger>
          <TabsTrigger value="assignment" className="gap-1.5">
            <FileText className="h-4 w-4" />
            Assignments
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Events List */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-4"
      >
        {filteredEvents.map((event) => {
          const status = getEventStatus(event);
          const isRegistered = registrations[event.id];

          return (
            <motion.div key={event.id} variants={itemVariants}>
              <Card className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      {getEventIcon(event.event_type)}
                      <div>
                        <CardTitle className="text-lg">{event.title}</CardTitle>
                        <CardDescription>
                          {event.jobs?.title} • {event.jobs?.institute}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={status.variant}>{status.label}</Badge>
                      <Badge variant="secondary">{getEventTypeLabel(event.event_type)}</Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {event.description && (
                    <p className="text-sm text-muted-foreground">{event.description}</p>
                  )}

                  <div className="flex flex-wrap gap-4 text-sm">
                    {event.event_type === 'webinar' && (
                      <>
                        {event.start_time && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            {format(new Date(event.start_time), 'PPP p')}
                          </div>
                        )}
                        {event.platform && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Video className="h-4 w-4" />
                            {getPlatformLabel(event.platform)}
                          </div>
                        )}
                      </>
                    )}
                    {event.event_type === 'quiz' && event.time_limit_minutes && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        {event.time_limit_minutes} minutes
                      </div>
                    )}
                    {event.event_type === 'assignment' && event.submission_deadline && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        Due: {format(new Date(event.submission_deadline), 'PPP')}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-3 pt-2 border-t">
                    {event.event_type === 'webinar' && (
                      <>
                        {isRegistered ? (
                          <div className="flex items-center gap-2 text-green-600">
                            <CheckCircle className="h-4 w-4" />
                            <span className="text-sm font-medium">Registered</span>
                          </div>
                        ) : status.label !== 'Ended' && (
                          <Button 
                            size="sm" 
                            onClick={() => handleRegister(event.id)}
                            disabled={registeringId === event.id}
                          >
                            {registeringId === event.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              'Register'
                            )}
                          </Button>
                        )}
                        {isRegistered && event.meeting_link && status.label === 'Live Now' && (
                          <Button size="sm" asChild>
                            <a href={event.meeting_link} target="_blank" rel="noopener noreferrer">
                              Join Now
                              <ExternalLink className="h-4 w-4 ml-1" />
                            </a>
                          </Button>
                        )}
                      </>
                    )}

                    {event.event_type === 'quiz' && status.label !== 'Closed' && (
                      <Button size="sm" onClick={() => setSelectedQuizEvent(event)}>
                        <Play className="h-4 w-4 mr-1" />
                        Start Quiz
                      </Button>
                    )}

                    {event.event_type === 'assignment' && status.label !== 'Deadline Passed' && (
                      <Button size="sm" onClick={() => setSelectedAssignmentEvent(event)}>
                        <Upload className="h-4 w-4 mr-1" />
                        Submit Assignment
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Quiz Modal */}
      {selectedQuizEvent && (
        <QuizModal
          open={!!selectedQuizEvent}
          onOpenChange={(open) => !open && setSelectedQuizEvent(null)}
          event={selectedQuizEvent}
        />
      )}

      {/* Assignment Modal */}
      {selectedAssignmentEvent && (
        <AssignmentModal
          open={!!selectedAssignmentEvent}
          onOpenChange={(open) => !open && setSelectedAssignmentEvent(null)}
          event={selectedAssignmentEvent}
        />
      )}
    </div>
  );
};

export default CandidateEventsSection;
