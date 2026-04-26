import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Mail,
  Eye,
  MousePointerClick,
  Search,
  Clock,
  User,
  ChevronDown,
  ChevronUp,
  BarChart3,
  TrendingUp,
  Send,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import TabHeader from "./dashboard/TabHeader";

interface Message {
  id: string;
  candidate_name: string;
  candidate_email: string;
  subject: string;
  message: string;
  job_title: string | null;
  status: string;
  opened_at: string | null;
  open_count: number;
  click_count: number;
  last_clicked_at: string | null;
  created_at: string;
}

interface AnalyticsSummary {
  totalSent: number;
  totalOpened: number;
  totalClicked: number;
  openRate: number;
  clickRate: number;
}

const MessageHistoryTab = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [sortField, setSortField] = useState<"created_at" | "open_count" | "click_count">("created_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [analytics, setAnalytics] = useState<AnalyticsSummary>({
    totalSent: 0,
    totalOpened: 0,
    totalClicked: 0,
    openRate: 0,
    clickRate: 0,
  });

  const fetchMessages = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("recruiter_messages")
        .select("*")
        .eq("recruiter_id", user.id)
        .order(sortField, { ascending: sortOrder === "asc" });

      if (error) throw error;

      const typedData = (data || []) as Message[];
      setMessages(typedData);

      // Calculate analytics
      const totalSent = typedData.length;
      const totalOpened = typedData.filter((m) => m.open_count > 0).length;
      const totalClicked = typedData.filter((m) => m.click_count > 0).length;

      setAnalytics({
        totalSent,
        totalOpened,
        totalClicked,
        openRate: totalSent > 0 ? (totalOpened / totalSent) * 100 : 0,
        clickRate: totalOpened > 0 ? (totalClicked / totalOpened) * 100 : 0,
      });
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, [user, sortField, sortOrder]);

  const handleSort = (field: "created_at" | "open_count" | "click_count") => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  const SortIcon = ({ field }: { field: string }) => {
    if (sortField !== field) return null;
    return sortOrder === "asc" ? (
      <ChevronUp className="h-4 w-4 inline ml-1" />
    ) : (
      <ChevronDown className="h-4 w-4 inline ml-1" />
    );
  };

  const filteredMessages = messages.filter(
    (m) =>
      m.candidate_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.candidate_email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusBadge = (message: Message) => {
    if (message.click_count > 0) {
      return (
        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/15">
          <MousePointerClick className="h-3 w-3 mr-1" />
          Clicked
        </Badge>
      );
    }
    if (message.open_count > 0) {
      return (
        <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/15">
          <Eye className="h-3 w-3 mr-1" />
          Opened
        </Badge>
      );
    }
    return (
      <Badge variant="secondary">
        <Send className="h-3 w-3 mr-1" />
        Sent
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <TabHeader
          icon={Mail}
          title="Messages"
          description="Track outreach engagement and follow up with candidates"
        />
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-[400px] rounded-xl" />
      </div>
    );
  }

  const statCards = [
    { label: "Total Sent", value: analytics.totalSent, icon: Send, color: "text-primary", bg: "bg-primary/10" },
    { label: "Opened", value: analytics.totalOpened, icon: Eye, color: "text-sky-600 dark:text-sky-400", bg: "bg-sky-500/10" },
    { label: "Clicked", value: analytics.totalClicked, icon: MousePointerClick, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-500/10" },
    { label: "Open Rate", value: `${analytics.openRate.toFixed(1)}%`, icon: BarChart3, color: "text-violet-600 dark:text-violet-400", bg: "bg-violet-500/10" },
    { label: "Click Rate", value: `${analytics.clickRate.toFixed(1)}%`, icon: TrendingUp, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-500/10" },
  ];

  return (
    <div className="space-y-6">
      <TabHeader
        icon={Mail}
        title="Messages"
        description="Track outreach engagement and follow up with candidates"
        badge={
          messages.length > 0 && (
            <Badge variant="secondary" className="ml-1">
              {messages.length}
            </Badge>
          )
        }
        actions={
          <Button variant="outline" size="sm" onClick={fetchMessages} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
        }
      />

      {/* Analytics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {statCards.map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-border/60 bg-card p-4 hover:border-border hover:shadow-[var(--shadow-soft)] transition-all duration-200"
          >
            <div className="flex items-center gap-3">
              <div className={`h-9 w-9 rounded-lg ${stat.bg} flex items-center justify-center shrink-0`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
              <div className="min-w-0">
                <p className="font-heading text-xl font-bold text-foreground tracking-tight leading-none">
                  {stat.value}
                </p>
                <p className="text-[11px] text-muted-foreground mt-1">{stat.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Message History Table */}
      <Card className="border-border/60">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4">
          <CardTitle className="font-heading text-base flex items-center gap-2">
            <Mail className="h-4 w-4 text-primary" />
            Message History
          </CardTitle>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search messages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
        </CardHeader>
        <CardContent>
          {filteredMessages.length === 0 ? (
            <EmptyState
              icon={Mail}
              title={searchQuery ? "No messages match your search" : "No messages sent yet"}
              description={
                searchQuery
                  ? "Try adjusting your search to find what you're looking for."
                  : "Messages you send to candidates will appear here with engagement tracking."
              }
              className="border-0 shadow-none p-8"
            />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Candidate</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Candidate</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead
                      className="cursor-pointer hover:text-foreground"
                      onClick={() => handleSort("open_count")}
                    >
                      Opens <SortIcon field="open_count" />
                    </TableHead>
                    <TableHead
                      className="cursor-pointer hover:text-foreground"
                      onClick={() => handleSort("click_count")}
                    >
                      Clicks <SortIcon field="click_count" />
                    </TableHead>
                    <TableHead
                      className="cursor-pointer hover:text-foreground"
                      onClick={() => handleSort("created_at")}
                    >
                      Sent <SortIcon field="created_at" />
                    </TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMessages.map((message) => (
                    <TableRow key={message.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <User className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">{message.candidate_name}</p>
                            <p className="text-xs text-muted-foreground">{message.candidate_email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm truncate max-w-[200px]">
                            {message.subject}
                          </p>
                          {message.job_title && (
                            <p className="text-xs text-muted-foreground">{message.job_title}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(message)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Eye className="h-4 w-4 text-muted-foreground" />
                          <span>{message.open_count}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <MousePointerClick className="h-4 w-4 text-muted-foreground" />
                          <span>{message.click_count}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          <span className="text-sm">
                            {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedMessage(message)}
                        >
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Message Detail Modal */}
      <Dialog open={!!selectedMessage} onOpenChange={() => setSelectedMessage(null)}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-primary" />
              Message Details
            </DialogTitle>
          </DialogHeader>

          {selectedMessage && (
            <div className="space-y-4">
              {/* Recipient Info */}
              <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">{selectedMessage.candidate_name}</p>
                  <p className="text-sm text-muted-foreground">{selectedMessage.candidate_email}</p>
                </div>
                <div className="ml-auto">{getStatusBadge(selectedMessage)}</div>
              </div>

              {/* Analytics */}
              <div className="grid grid-cols-3 gap-4">
                <div className="p-3 bg-secondary/30 rounded-lg text-center">
                  <p className="text-2xl font-bold">{selectedMessage.open_count}</p>
                  <p className="text-xs text-muted-foreground">Opens</p>
                  {selectedMessage.opened_at && (
                    <p className="text-xs text-muted-foreground mt-1">
                      First: {format(new Date(selectedMessage.opened_at), "MMM d, h:mm a")}
                    </p>
                  )}
                </div>
                <div className="p-3 bg-secondary/30 rounded-lg text-center">
                  <p className="text-2xl font-bold">{selectedMessage.click_count}</p>
                  <p className="text-xs text-muted-foreground">Clicks</p>
                  {selectedMessage.last_clicked_at && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Last: {format(new Date(selectedMessage.last_clicked_at), "MMM d, h:mm a")}
                    </p>
                  )}
                </div>
                <div className="p-3 bg-secondary/30 rounded-lg text-center">
                  <p className="text-2xl font-bold">
                    {format(new Date(selectedMessage.created_at), "MMM d")}
                  </p>
                  <p className="text-xs text-muted-foreground">Sent</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {format(new Date(selectedMessage.created_at), "h:mm a")}
                  </p>
                </div>
              </div>

              {/* Subject */}
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Subject</p>
                <p className="font-medium">{selectedMessage.subject}</p>
              </div>

              {/* Message Body */}
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Message</p>
                <div className="bg-secondary/30 rounded-lg p-4 max-h-60 overflow-y-auto whitespace-pre-wrap text-sm">
                  {selectedMessage.message}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MessageHistoryTab;
