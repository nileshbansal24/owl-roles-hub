import { InstitutionData } from "@/hooks/useAdminStats";
import { format } from "date-fns";
import { Building2, CheckCircle, Clock, XCircle, Briefcase, Mail } from "lucide-react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FadeIn, staggerContainerVariants, staggerItemVariants } from "@/components/ui/fade-in";

interface AdminInstitutionsProps {
  institutions: InstitutionData[];
  loading: boolean;
}

const getStatusBadge = (status: string | null) => {
  switch (status) {
    case "verified":
      return (
        <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
          <CheckCircle className="h-3 w-3 mr-1" />
          Verified
        </Badge>
      );
    case "pending":
      return (
        <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20">
          <Clock className="h-3 w-3 mr-1" />
          Pending
        </Badge>
      );
    case "rejected":
      return (
        <Badge className="bg-destructive/10 text-destructive border-destructive/20">
          <XCircle className="h-3 w-3 mr-1" />
          Rejected
        </Badge>
      );
    default:
      return (
        <Badge variant="outline" className="text-muted-foreground">
          Not Requested
        </Badge>
      );
  }
};

const AdminInstitutions = ({ institutions, loading }: AdminInstitutionsProps) => {
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

  const verified = institutions.filter(i => i.verification_status === "verified").length;
  const pending = institutions.filter(i => i.verification_status === "pending").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-heading font-bold">Institutions</h1>
        <p className="text-muted-foreground mt-1">
          Manage all registered institutions and their verification status
        </p>
      </motion.div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <FadeIn delay={0.1}>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-lg bg-primary/10">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{institutions.length}</p>
                <p className="text-sm text-muted-foreground">Total Institutions</p>
              </div>
            </CardContent>
          </Card>
        </FadeIn>
        <FadeIn delay={0.2}>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-lg bg-emerald-500/10">
                <CheckCircle className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{verified}</p>
                <p className="text-sm text-muted-foreground">Verified</p>
              </div>
            </CardContent>
          </Card>
        </FadeIn>
        <FadeIn delay={0.3}>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-lg bg-amber-500/10">
                <Clock className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pending}</p>
                <p className="text-sm text-muted-foreground">Pending Review</p>
              </div>
            </CardContent>
          </Card>
        </FadeIn>
      </div>

      {/* Institutions Table */}
      <FadeIn delay={0.4}>
        <Card>
          <CardHeader>
            <CardTitle>All Institutions</CardTitle>
          </CardHeader>
          <CardContent>
            {institutions.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No institutions registered yet</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>University</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-center">Jobs</TableHead>
                      <TableHead>Joined</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <motion.tbody
                      variants={staggerContainerVariants}
                      initial="hidden"
                      animate="visible"
                      className="contents"
                    >
                      {institutions.map((institution) => (
                        <motion.tr
                          key={institution.id}
                          variants={staggerItemVariants}
                          className="contents"
                        >
                          <TableRow>
                            <TableCell className="font-medium">
                              {institution.full_name || "—"}
                            </TableCell>
                            <TableCell>
                              {institution.email ? (
                                <a 
                                  href={`mailto:${institution.email}`}
                                  className="flex items-center gap-1 text-primary hover:underline"
                                >
                                  <Mail className="h-3 w-3" />
                                  {institution.email}
                                </a>
                              ) : "—"}
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {institution.university || "—"}
                            </TableCell>
                            <TableCell>
                              {getStatusBadge(institution.verification_status)}
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="flex items-center justify-center gap-1">
                                <Briefcase className="h-3 w-3 text-muted-foreground" />
                                {institution.jobs_count}
                              </div>
                            </TableCell>
                            <TableCell className="text-muted-foreground text-sm">
                              {format(new Date(institution.created_at), "MMM d, yyyy")}
                            </TableCell>
                          </TableRow>
                        </motion.tr>
                      ))}
                    </motion.tbody>
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

export default AdminInstitutions;
