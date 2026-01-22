import * as React from "react";
import { motion } from "framer-motion";
import { 
  FileText, 
  Users, 
  TrendingUp, 
  Quote, 
  ExternalLink,
  Award,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface CoAuthor {
  name: string;
  author_id?: string;
  affiliation?: string;
}

interface ScopusMetrics {
  h_index: number | null;
  document_count: number | null;
  citation_count: number | null;
  co_authors: CoAuthor[];
}

interface ScopusMetricsCardProps {
  metrics: ScopusMetrics | null;
  scopusLink?: string | null;
}

export const ScopusMetricsCard: React.FC<ScopusMetricsCardProps> = ({ metrics, scopusLink }) => {
  if (!metrics || (metrics.h_index === null && metrics.document_count === null)) {
    return null;
  }

  const getScopusAuthorUrl = (authorId: string) => 
    `https://www.scopus.com/authid/detail.uri?authorId=${authorId}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6"
    >
      <Card className="bg-gradient-to-br from-orange-500/5 via-amber-500/5 to-yellow-500/5 border-orange-500/20">
        <CardContent className="p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-orange-500/10">
                <Award className="h-4 w-4 text-orange-600" />
              </div>
              <span className="font-heading font-semibold text-sm text-foreground">Scopus Metrics</span>
            </div>
            {scopusLink && (
              <a href={scopusLink} target="_blank" rel="noopener noreferrer">
                <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 text-muted-foreground hover:text-orange-600">
                  View Profile <ExternalLink className="h-3 w-3" />
                </Button>
              </a>
            )}
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            {metrics.document_count !== null && (
              <div className="bg-background/60 rounded-lg p-3 text-center">
                <div className="flex items-center justify-center gap-1.5 mb-1">
                  <FileText className="h-3.5 w-3.5 text-orange-600" />
                </div>
                <div className="text-xl font-bold text-foreground">{metrics.document_count}</div>
                <div className="text-xs text-muted-foreground">Documents</div>
              </div>
            )}
            
            {metrics.h_index !== null && (
              <div className="bg-background/60 rounded-lg p-3 text-center">
                <div className="flex items-center justify-center gap-1.5 mb-1">
                  <TrendingUp className="h-3.5 w-3.5 text-orange-600" />
                </div>
                <div className="text-xl font-bold text-foreground">{metrics.h_index}</div>
                <div className="text-xs text-muted-foreground">h-index</div>
              </div>
            )}
            
            {metrics.citation_count !== null && (
              <div className="bg-background/60 rounded-lg p-3 text-center">
                <div className="flex items-center justify-center gap-1.5 mb-1">
                  <Quote className="h-3.5 w-3.5 text-orange-600" />
                </div>
                <div className="text-xl font-bold text-foreground">{metrics.citation_count}</div>
                <div className="text-xs text-muted-foreground">Citations</div>
              </div>
            )}
          </div>

          {/* Co-Authors */}
          {metrics.co_authors && metrics.co_authors.length > 0 && (
            <div className="border-t border-border/50 pt-3">
              <div className="flex items-center gap-1.5 mb-2">
                <Users className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground">
                  Top Co-Authors ({metrics.co_authors.length})
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {metrics.co_authors.slice(0, 8).map((coAuthor, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="text-xs font-normal bg-background/80 hover:bg-orange-500/10 cursor-default"
                    title={coAuthor.affiliation || undefined}
                  >
                    {coAuthor.author_id ? (
                      <a
                        href={getScopusAuthorUrl(coAuthor.author_id)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-orange-600 transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {coAuthor.name}
                      </a>
                    ) : (
                      coAuthor.name
                    )}
                  </Badge>
                ))}
                {metrics.co_authors.length > 8 && (
                  <Badge variant="outline" className="text-xs font-normal">
                    +{metrics.co_authors.length - 8} more
                  </Badge>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default ScopusMetricsCard;
