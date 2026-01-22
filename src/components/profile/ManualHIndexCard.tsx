import * as React from "react";
import { useState } from "react";
import { motion } from "framer-motion";
import { TrendingUp, Edit2, Check, X, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";

interface ManualHIndexCardProps {
  currentHIndex: number | null;
  onSave: (hIndex: number | null) => Promise<void>;
  hasScopusMetrics?: boolean;
}

export const ManualHIndexCard: React.FC<ManualHIndexCardProps> = ({
  currentHIndex,
  onSave,
  hasScopusMetrics = false,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [hIndexValue, setHIndexValue] = useState(currentHIndex?.toString() || "");
  const [isSaving, setIsSaving] = useState(false);

  // Don't show if Scopus metrics are already present (they include h-index)
  if (hasScopusMetrics) {
    return null;
  }

  const handleSave = async () => {
    const parsedValue = hIndexValue.trim() ? parseInt(hIndexValue, 10) : null;
    
    if (hIndexValue.trim() && (isNaN(parsedValue!) || parsedValue! < 0 || parsedValue! > 300)) {
      toast.error("Please enter a valid h-index (0-300)");
      return;
    }

    setIsSaving(true);
    try {
      await onSave(parsedValue);
      setIsEditing(false);
      toast.success("H-index updated successfully");
    } catch (error) {
      toast.error("Failed to update h-index");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setHIndexValue(currentHIndex?.toString() || "");
    setIsEditing(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-4"
    >
      <Card className="bg-secondary/30 border-border/50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <TrendingUp className="h-4 w-4 text-primary" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-medium text-sm text-foreground">h-index</span>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p className="text-xs">
                          The h-index measures research impact. A researcher has h-index of <strong>h</strong> if <strong>h</strong> of their papers have been cited at least <strong>h</strong> times each. 
                          <br /><br />
                          Example: h-index of 10 means you have 10 papers with at least 10 citations each.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <p className="text-xs text-muted-foreground">
                  {currentHIndex !== null ? "Your research impact score" : "Add your h-index manually"}
                </p>
              </div>
            </div>

            {isEditing ? (
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min="0"
                  max="300"
                  value={hIndexValue}
                  onChange={(e) => setHIndexValue(e.target.value)}
                  placeholder="e.g., 12"
                  className="w-20 h-8 text-sm text-center"
                  autoFocus
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-100"
                  onClick={handleSave}
                  disabled={isSaving}
                >
                  <Check className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                  onClick={handleCancel}
                  disabled={isSaving}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                {currentHIndex !== null && (
                  <span className="text-2xl font-bold text-primary">{currentHIndex}</span>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 text-xs gap-1.5 text-muted-foreground hover:text-foreground"
                  onClick={() => setIsEditing(true)}
                >
                  <Edit2 className="h-3.5 w-3.5" />
                  {currentHIndex !== null ? "Edit" : "Add"}
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default ManualHIndexCard;
