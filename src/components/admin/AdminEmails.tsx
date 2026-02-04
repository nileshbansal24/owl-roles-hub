import { format } from "date-fns";
import { Mail, Users, Building2, User, Copy, Check } from "lucide-react";
import { motion } from "framer-motion";
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
import { FadeIn } from "@/components/ui/fade-in";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface EmailData {
  id: string;
  email: string | null;
  full_name: string | null;
  user_type: string | null;
  created_at: string;
}

interface AdminEmailsProps {
  emails: EmailData[];
  loading: boolean;
}

const AdminEmails = ({ emails, loading }: AdminEmailsProps) => {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filteredEmails = emails.filter(e => {
    const query = searchQuery.toLowerCase();
    return (
      (e.email?.toLowerCase().includes(query) || false) ||
      (e.full_name?.toLowerCase().includes(query) || false) ||
      (e.user_type?.toLowerCase().includes(query) || false)
    );
  });

  const candidateEmails = emails.filter(e => e.user_type === "candidate");
  const recruiterEmails = emails.filter(e => e.user_type === "recruiter");

  const copyEmail = async (email: string, id: string) => {
    await navigator.clipboard.writeText(email);
    setCopiedId(id);
    toast({
      title: "Copied!",
      description: "Email copied to clipboard",
    });
    setTimeout(() => setCopiedId(null), 2000);
  };

  const copyAllEmails = async () => {
    const allEmails = filteredEmails
      .filter(e => e.email)
      .map(e => e.email)
      .join(", ");
    await navigator.clipboard.writeText(allEmails);
    toast({
      title: "Copied!",
      description: `${filteredEmails.filter(e => e.email).length} emails copied to clipboard`,
    });
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-muted rounded w-1/4 animate-pulse" />
        <Card className="animate-pulse">
          <CardContent className="p-6">
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 bg-muted rounded" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-heading font-bold">Registered Emails</h1>
        <p className="text-muted-foreground mt-1">
          All registered emails in the portal
        </p>
      </motion.div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <FadeIn delay={0.1}>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-lg bg-primary/10">
                <Mail className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{emails.length}</p>
                <p className="text-sm text-muted-foreground">Total Registered</p>
              </div>
            </CardContent>
          </Card>
        </FadeIn>
        <FadeIn delay={0.2}>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-lg bg-emerald-500/10">
                <User className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{candidateEmails.length}</p>
                <p className="text-sm text-muted-foreground">Candidates</p>
              </div>
            </CardContent>
          </Card>
        </FadeIn>
        <FadeIn delay={0.3}>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-lg bg-violet-500/10">
                <Building2 className="h-5 w-5 text-violet-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{recruiterEmails.length}</p>
                <p className="text-sm text-muted-foreground">Recruiters</p>
              </div>
            </CardContent>
          </Card>
        </FadeIn>
      </div>

      {/* Search and Actions */}
      <FadeIn delay={0.35}>
        <div className="flex flex-col sm:flex-row gap-4">
          <Input
            placeholder="Search by email, name, or type..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1"
          />
          <Button onClick={copyAllEmails} variant="outline" className="gap-2">
            <Copy className="h-4 w-4" />
            Copy All ({filteredEmails.filter(e => e.email).length})
          </Button>
        </div>
      </FadeIn>

      {/* Emails Table */}
      <FadeIn delay={0.4}>
        <Card>
          <CardHeader>
            <CardTitle>All Emails ({filteredEmails.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredEmails.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No emails found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEmails.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">
                          {user.email ? (
                            <a 
                              href={`mailto:${user.email}`}
                              className="flex items-center gap-1 text-primary hover:underline"
                            >
                              <Mail className="h-3 w-3" />
                              {user.email}
                            </a>
                          ) : "—"}
                        </TableCell>
                        <TableCell>
                          {user.full_name || "—"}
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant="outline"
                            className={
                              user.user_type === "recruiter" 
                                ? "bg-violet-500/10 text-violet-500 border-violet-500/20" 
                                : "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                            }
                          >
                            {user.user_type === "recruiter" ? (
                              <Building2 className="h-3 w-3 mr-1" />
                            ) : (
                              <User className="h-3 w-3 mr-1" />
                            )}
                            {user.user_type || "Unknown"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {format(new Date(user.created_at), "MMM d, yyyy")}
                        </TableCell>
                        <TableCell>
                          {user.email && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8"
                              onClick={() => copyEmail(user.email!, user.id)}
                            >
                              {copiedId === user.id ? (
                                <Check className="h-4 w-4 text-emerald-500" />
                              ) : (
                                <Copy className="h-4 w-4" />
                              )}
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </FadeIn>
    </div>
  );
};

export default AdminEmails;