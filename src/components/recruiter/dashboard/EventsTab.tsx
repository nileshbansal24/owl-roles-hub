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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useRecruiterEvents } from '@/hooks/useEvents';
import { Event, getEventStatusColor, getEventTypeLabel, getPlatformLabel } from '@/types/events';
import CreateEventModal from './CreateEventModal';
import EventDetailModal from './EventDetailModal';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
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
        return <Video className="h-5 w-5 text-blue-500" />;
      case 'quiz':
        return <HelpCircle className="h-5 w-5 text-purple-500" />;
      case 'assignment':
        return <FileText className="h-5 w-5 text-orange-500" />;
      default:
        return <Calendar className="h-5 w-5" />;
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
      <div className="flex items-center justify-center py-12">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        >
          <Clock className="h-8 w-8 text-primary" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Events</h2>
          <p className="text-muted-foreground">
            Create and manage webinars, quizzes, and assignments for your applicants
          </p>
        </div>
        <Button onClick={() => setCreateModalOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Create Event
        </Button>
      </div>

      {/* Filter Tabs */}
      <Tabs value={activeFilter} onValueChange={(v) => setActiveFilter(v as any)}>
        <TabsList>
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
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="rounded-full bg-muted p-4 mb-4">
              <Calendar className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No events yet</h3>
            <p className="text-muted-foreground text-center max-w-sm mb-4">
              Create your first event to engage with applicants through webinars, quizzes, or assignments.
            </p>
            <Button onClick={() => setCreateModalOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Create Event
            </Button>
          </CardContent>
        </Card>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
        >
          {filteredEvents.map((event) => (
            <motion.div key={event.id} variants={itemVariants}>
              <Card className="h-full hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      {getEventIcon(event.event_type)}
                      <div>
                        <CardTitle className="text-lg line-clamp-1">{event.title}</CardTitle>
                        <CardDescription className="line-clamp-1">
                          {event.jobs?.title} • {event.jobs?.institute}
                        </CardDescription>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
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
                          className="text-destructive"
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
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className={getEventStatusColor(event.status)}>
                      {event.status}
                    </Badge>
                    <Badge variant="secondary">
                      {getEventTypeLabel(event.event_type)}
                    </Badge>
                  </div>

                  {event.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {event.description}
                    </p>
                  )}

                  <div className="space-y-1 text-sm">
                    {event.event_type === 'webinar' && event.start_time && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        {format(new Date(event.start_time), 'PPP p')}
                      </div>
                    )}
                    {event.event_type === 'webinar' && event.platform && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Video className="h-4 w-4" />
                        {getPlatformLabel(event.platform)}
                      </div>
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

                  <div className="flex items-center gap-4 pt-2 border-t text-sm text-muted-foreground">
                    {event.event_type === 'webinar' && (
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {event.registrations_count || 0} registered
                      </div>
                    )}
                    {(event.event_type === 'quiz' || event.event_type === 'assignment') && (
                      <>
                        {event.event_type === 'quiz' && (
                          <div className="flex items-center gap-1">
                            <HelpCircle className="h-4 w-4" />
                            {event.questions_count || 0} questions
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <FileText className="h-4 w-4" />
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
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default EventsTab;
