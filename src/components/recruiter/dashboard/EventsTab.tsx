import { useState } from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import {
  Video,
  HelpCircle,
  FileText,
  Plus,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  Send,
  Users,
  Clock,
  Calendar,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EmptyState } from '@/components/ui/empty-state';
import { CardGridSkeleton } from '@/components/ui/loading-skeleton';
import { useRecruiterEvents } from '@/hooks/useEvents';
import { Event, getEventStatusColor, getEventTypeLabel, getPlatformLabel } from '@/types/events';
import CreateEventModal from './CreateEventModal';
import EventDetailModal from './EventDetailModal';
import TabHeader from './TabHeader';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0 },
};

interface EventsTabProps {
  jobs: Array<{ id: string; title: string; institute: string }>;
}

const EventsTab = ({ jobs }: EventsTabProps) => {
  const { events, loading, publishEvent, deleteEvent } = useRecruiterEvents();
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<Event | null>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | 'webinar' | 'quiz' | 'assignment'>('all');

  const filteredEvents = events.filter(event =>
    activeFilter === 'all' || event.event_type === activeFilter
  );

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'webinar':
        return <Video className="h-5 w-5 text-primary" />;
      case 'quiz':
        return <HelpCircle className="h-5 w-5 text-primary" />;
      case 'assignment':
        return <FileText className="h-5 w-5 text-primary" />;
      default:
        return <Calendar className="h-5 w-5 text-primary" />;
    }
  };

  const handlePublish = async (event: Event) => {
    await publishEvent(event.id);
  };

  const handleDelete = async () => {
    if (eventToDelete) {
      await deleteEvent(eventToDelete.id);
      setDeleteDialogOpen(false);
      setEventToDelete(null);
    }
  };

  const handleViewDetails = (event: Event) => {
    setSelectedEvent(event);
    setDetailModalOpen(true);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <TabHeader
          icon={Calendar}
          title="Events"
          description="Run webinars, quizzes and assignments to engage applicants beyond the resume."
        />
        <CardGridSkeleton count={6} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <TabHeader
        icon={Calendar}
        title="Events"
        description="Run webinars, quizzes and assignments to engage applicants beyond the resume."
        badge={
          events.length > 0 && (
            <Badge variant="secondary" className="ml-1">
              {events.length}
            </Badge>
          )
        }
        actions={
          <Button onClick={() => setCreateModalOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Create Event
          </Button>
        }
      />

      {/* Filter Tabs */}
      <Tabs value={activeFilter} onValueChange={(v) => setActiveFilter(v as any)}>
        <TabsList className="bg-muted/50">
          <TabsTrigger value="all">All Events</TabsTrigger>
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

      {/* Events Grid */}
      {filteredEvents.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title={activeFilter === 'all' ? 'No events scheduled' : `No ${activeFilter}s scheduled`}
          description="Create your first event and give applicants something more meaningful than a form."
          action={{
            label: 'Create Event',
            onClick: () => setCreateModalOpen(true),
            icon: Plus,
          }}
        />
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
        >
          {filteredEvents.map((event) => (
            <motion.div key={event.id} variants={itemVariants}>
              <Card className="h-full border-border/60 hover:border-border hover:shadow-[var(--shadow-soft)] transition-all duration-200">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        {getEventIcon(event.event_type)}
                      </div>
                      <div className="min-w-0">
                        <CardTitle className="font-heading text-base leading-tight line-clamp-1">
                          {event.title}
                        </CardTitle>
                        <CardDescription className="text-xs line-clamp-1 mt-0.5">
                          {event.jobs?.title} • {event.jobs?.institute}
                        </CardDescription>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 -mr-2">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleViewDetails(event)}>
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleViewDetails(event)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        {event.status === 'draft' && (
                          <DropdownMenuItem onClick={() => handlePublish(event)}>
                            <Send className="h-4 w-4 mr-2" />
                            Publish
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => {
                            setEventToDelete(event);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex flex-wrap gap-1.5">
                    <Badge variant="outline" className={`${getEventStatusColor(event.status)} text-[11px] capitalize`}>
                      {event.status}
                    </Badge>
                    <Badge variant="secondary" className="text-[11px]">
                      {getEventTypeLabel(event.event_type)}
                    </Badge>
                  </div>

                  {event.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                      {event.description}
                    </p>
                  )}

                  <div className="space-y-1.5 text-xs">
                    {event.event_type === 'webinar' && event.start_time && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-3.5 w-3.5" />
                        {format(new Date(event.start_time), 'PPP p')}
                      </div>
                    )}
                    {event.event_type === 'webinar' && event.platform && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Video className="h-3.5 w-3.5" />
                        {getPlatformLabel(event.platform)}
                      </div>
                    )}
                    {event.event_type === 'quiz' && event.time_limit_minutes && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="h-3.5 w-3.5" />
                        {event.time_limit_minutes} minutes
                      </div>
                    )}
                    {event.event_type === 'assignment' && event.submission_deadline && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-3.5 w-3.5" />
                        Due: {format(new Date(event.submission_deadline), 'PPP')}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-4 pt-3 border-t border-border/60 text-xs text-muted-foreground">
                    {event.event_type === 'webinar' && (
                      <div className="flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5" />
                        {event.registrations_count || 0} registered
                      </div>
                    )}
                    {(event.event_type === 'quiz' || event.event_type === 'assignment') && (
                      <>
                        {event.event_type === 'quiz' && (
                          <div className="flex items-center gap-1.5">
                            <HelpCircle className="h-3.5 w-3.5" />
                            {event.questions_count || 0} questions
                          </div>
                        )}
                        <div className="flex items-center gap-1.5">
                          <FileText className="h-3.5 w-3.5" />
                          {event.submissions_count || 0} submissions
                        </div>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Create Event Modal */}
      <CreateEventModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        jobs={jobs}
      />

      {/* Event Detail Modal */}
      {selectedEvent && (
        <EventDetailModal
          open={detailModalOpen}
          onOpenChange={setDetailModalOpen}
          event={selectedEvent}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Event</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{eventToDelete?.title}"? This action cannot be undone
              and will remove all associated questions, registrations, and submissions.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default EventsTab;
