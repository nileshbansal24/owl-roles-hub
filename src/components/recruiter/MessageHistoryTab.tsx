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
        <Badge className="bg-green-500/10 text-green-600 hover:bg-green-500/20">
          <MousePointerClick className="h-3 w-3 mr-1" />
          Clicked
        </Badge>
      );
    }
    if (message.open_count > 0) {
      return (
        <Badge className="bg-blue-500/10 text-blue-600 hover:bg-blue-500/20">
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
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Send className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{analytics.totalSent}</p>
                <p className="text-xs text-muted-foreground">Total Sent</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Eye className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{analytics.totalOpened}</p>
                <p className="text-xs text-muted-foreground">Opened</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <MousePointerClick className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{analytics.totalClicked}</p>
                <p className="text-xs text-muted-foreground">Clicked</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10">
                <BarChart3 className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{analytics.openRate.toFixed(1)}%</p>
                <p className="text-xs text-muted-foreground">Open Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-500/10">
                <TrendingUp className="h-5 w-5 text-orange-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{analytics.clickRate.toFixed(1)}%</p>
                <p className="text-xs text-muted-foreground">Click Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Message History Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Message History
          </CardTitle>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search messages..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 w-64"
              />
            </div>
            <Button variant="outline" size="icon" onClick={fetchMessages}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {filteredMessages.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No messages sent yet</p>
              <p className="text-sm">Messages you send to candidates will appear here</p>
            </div>
          ) : (
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
