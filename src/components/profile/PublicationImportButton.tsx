import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ExternalLink, 
  FileSearch, 
  Loader2, 
  CheckCircle, 
  Download, 
  Sparkles,
  GraduationCap,
  BookOpen,
  ChevronDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface PublicationImportButtonProps {
  scopusLink: string | null;
  orcidId: string | null;
  onPublicationsImported: (papers: Array<{ title: string; authors: string; date: string; doi?: string; journal?: string }>) => void;
  onScopusSave: (link: string) => Promise<void>;
  onOrcidSave: (id: string) => Promise<void>;
}

type ImportSource = "scopus" | "orcid" | "scholar";
type ImportState = "idle" | "importing" | "success" | "error";

interface ParsedPaper {
  title: string;
  authors: string;
  date: string;
  doi?: string;
  journal?: string;
}

export const PublicationImportButton = ({ 
  scopusLink, 
  orcidId,
  onPublicationsImported,
  onScopusSave,
  onOrcidSave
}: PublicationImportButtonProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeSource, setActiveSource] = useState<ImportSource>("orcid");
  const [importState, setImportState] = useState<ImportState>("idle");
  const [importedCount, setImportedCount] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  
  // Input states
  const [scopusInput, setScopusInput] = useState(scopusLink || "");
  const [orcidInput, setOrcidInput] = useState(orcidId || "");
  const [scholarInput, setScholarInput] = useState("");
  
  const { toast } = useToast();

  const handleImportScopus = async () => {
    let url = scopusInput.trim();
    if (!url.startsWith("http")) {
      url = `https://${url}`;
    }

    const scopusPattern = /^https?:\/\/(www\.)?scopus\.com\//i;
    if (!scopusPattern.test(url) && !url.startsWith("scopus.com")) {
      toast({
        title: "Invalid Scopus Link",
        description: "Please enter a valid Scopus profile URL",
        variant: "destructive",
      });
      return;
    }

    setImportState("importing");

    try {
      const response = await supabase.functions.invoke("fetch-scopus", {
        body: { scopusUrl: url },
      });

      if (response.error) {
        throw new Error(response.error.message || "Could not fetch publications from Scopus");
      }

      if (response.data?.success) {
        setImportedCount(response.data.count || 0);
        setImportState("success");
        onPublicationsImported(response.data.publications || []);
        
        toast({
          title: "Publications imported!",
          description: `Successfully imported ${response.data.count} publications from Scopus.`,
        });

        setTimeout(() => {
          setIsDialogOpen(false);
          setImportState("idle");
        }, 2000);
        return;
      }

      throw new Error("Failed to import from Scopus");
    } catch (error: any) {
      console.error("Scopus import error:", error);
      setImportState("error");
      toast({
        title: "Import failed",
        description: error.message || "Failed to import publications from Scopus",
        variant: "destructive",
      });
    }
  };

  const handleImportOrcid = async () => {
    const cleanOrcid = orcidInput.trim().replace(/[^0-9X-]/gi, "").toUpperCase();
    
    // Add dashes if not present
    let formattedOrcid = cleanOrcid;
    if (!cleanOrcid.includes("-") && cleanOrcid.length === 16) {
      formattedOrcid = `${cleanOrcid.slice(0,4)}-${cleanOrcid.slice(4,8)}-${cleanOrcid.slice(8,12)}-${cleanOrcid.slice(12,16)}`;
    }

    const orcidPattern = /^\d{4}-\d{4}-\d{4}-\d{3}[\dX]$/;
    if (!orcidPattern.test(formattedOrcid)) {
      toast({
        title: "Invalid ORCID",
        description: "Please enter a valid ORCID iD (format: XXXX-XXXX-XXXX-XXXX)",
        variant: "destructive",
      });
      return;
    }

    setImportState("importing");

    try {
      const response = await supabase.functions.invoke("fetch-orcid", {
        body: { orcidId: formattedOrcid },
      });

      if (response.error) {
        throw new Error(response.error.message || "Could not fetch publications from ORCID");
      }

      if (response.data?.success) {
        setImportedCount(response.data.count || 0);
        setImportState("success");
        onPublicationsImported(response.data.publications || []);
        await onOrcidSave(formattedOrcid);
        
        toast({
          title: "Publications imported!",
          description: `Successfully imported ${response.data.count} publications from ORCID.`,
        });

        setTimeout(() => {
          setIsDialogOpen(false);
          setImportState("idle");
        }, 2000);
        return;
      }

      throw new Error("Failed to import from ORCID");
    } catch (error: any) {
      console.error("ORCID import error:", error);
      setImportState("error");
      toast({
        title: "Import failed",
        description: error.message || "Failed to import publications from ORCID",
        variant: "destructive",
      });
    }
  };

  const parseScholarPaste = (text: string): ParsedPaper[] => {
    const papers: ParsedPaper[] = [];
    const lines = text.split("\n").filter(l => l.trim());
    
    let currentPaper: Partial<ParsedPaper> = {};
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Skip empty lines or navigation elements
      if (!line || line.match(/^(Cited by|Save|Cite|Related articles|All \d+ versions)/i)) {
        continue;
      }
      
      // Check if this looks like a title (longer text, usually first in a group)
      if (line.length > 20 && !line.match(/^\d{4}$/) && !line.includes(" - ") && !currentPaper.title) {
        currentPaper.title = line;
        continue;
      }
      
      // Check for author/journal/year pattern (e.g., "J Smith, A Jones - Journal Name, 2023")
      const pubMatch = line.match(/^(.+?)\s*[-–]\s*(.+?),?\s*(\d{4})\s*$/);
      if (pubMatch && currentPaper.title) {
        currentPaper.authors = pubMatch[1].trim();
        currentPaper.journal = pubMatch[2].trim();
        currentPaper.date = pubMatch[3];
        
        papers.push({
          title: currentPaper.title,
          authors: currentPaper.authors,
          date: currentPaper.date,
          journal: currentPaper.journal,
        });
        currentPaper = {};
        continue;
      }
      
      // Alternative pattern: just year
      const yearMatch = line.match(/^(\d{4})$/);
      if (yearMatch && currentPaper.title) {
        currentPaper.date = yearMatch[1];
        papers.push({
          title: currentPaper.title,
          authors: currentPaper.authors || "Unknown",
          date: currentPaper.date,
        });
        currentPaper = {};
        continue;
      }
      
      // Check for authors line (contains commas, shorter than title)
      if (line.includes(",") && line.length < 200 && currentPaper.title && !currentPaper.authors) {
        currentPaper.authors = line;
        continue;
      }
    }
    
    return papers;
  };

  const handleImportScholar = async () => {
    const papers = parseScholarPaste(scholarInput);
    
    if (papers.length === 0) {
      toast({
        title: "No publications found",
        description: "Could not parse any publications from the pasted text. Try copying directly from your Google Scholar profile.",
        variant: "destructive",
      });
      return;
    }

    setImportState("importing");
    setIsSaving(true);

    try {
      // Convert to JSON-compatible format
      const jsonPapers = papers.map(p => ({
        title: p.title,
        authors: p.authors,
        date: p.date,
        doi: p.doi || null,
        journal: p.journal || null,
      }));

      // Save to profile
      const { error } = await supabase
        .from("profiles")
        .update({ research_papers: jsonPapers })
        .eq("id", (await supabase.auth.getUser()).data.user?.id);

      if (error) throw error;

      setImportedCount(papers.length);
      setImportState("success");
      onPublicationsImported(papers);

      toast({
        title: "Publications imported!",
        description: `Successfully imported ${papers.length} publications from Google Scholar.`,
      });

      setTimeout(() => {
        setIsDialogOpen(false);
        setImportState("idle");
        setScholarInput("");
      }, 2000);
    } catch (error: any) {
      console.error("Scholar import error:", error);
      setImportState("error");
      toast({
        title: "Import failed",
        description: error.message || "Failed to save publications",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleImport = () => {
    switch (activeSource) {
      case "scopus":
        handleImportScopus();
        break;
      case "orcid":
        handleImportOrcid();
        break;
      case "scholar":
        handleImportScholar();
        break;
    }
  };

  const getInputValue = () => {
    switch (activeSource) {
      case "scopus": return scopusInput;
      case "orcid": return orcidInput;
      case "scholar": return scholarInput;
    }
  };

  const isConnected = (source: ImportSource) => {
    switch (source) {
      case "scopus": return !!scopusLink;
      case "orcid": return !!orcidId;
      case "scholar": return false;
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className="gap-2 border-primary/30 hover:border-primary hover:bg-primary/5 transition-all"
          >
            <Download className="h-4 w-4 text-primary" />
            <span>Import Publications</span>
            <ChevronDown className="h-3 w-3 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem 
            onClick={() => { setActiveSource("orcid"); setIsDialogOpen(true); }}
            className="gap-2"
          >
            <BookOpen className="h-4 w-4 text-green-600" />
            <span>Import from ORCID</span>
            {orcidId && <CheckCircle className="h-3 w-3 text-green-500 ml-auto" />}
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={() => { setActiveSource("scopus"); setIsDialogOpen(true); }}
            className="gap-2"
          >
            <FileSearch className="h-4 w-4 text-orange-600" />
            <span>Import from Scopus</span>
            {scopusLink && <CheckCircle className="h-3 w-3 text-green-500 ml-auto" />}
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={() => { setActiveSource("scholar"); setIsDialogOpen(true); }}
            className="gap-2"
          >
            <GraduationCap className="h-4 w-4 text-blue-600" />
            <span>Import from Google Scholar</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={isDialogOpen} onOpenChange={(open) => {
        setIsDialogOpen(open);
        if (!open) {
          setImportState("idle");
          setImportedCount(0);
        }
      }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Download className="h-5 w-5 text-primary" />
              Import Publications
            </DialogTitle>
            <DialogDescription>
              Import your research publications from academic databases.
            </DialogDescription>
          </DialogHeader>

          <AnimatePresence mode="wait">
            {importState === "importing" ? (
              <motion.div
                key="importing"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="py-8 text-center"
              >
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="h-8 w-8 text-primary animate-pulse" />
                </div>
                <p className="font-medium text-foreground mb-1">
                  Fetching Publications...
                </p>
                <p className="text-sm text-muted-foreground">
                  {activeSource === "orcid" && "Connecting to ORCID to import your works"}
                  {activeSource === "scopus" && "Connecting to Scopus to import your research papers"}
                  {activeSource === "scholar" && "Processing your Google Scholar publications"}
                </p>
                <div className="flex items-center justify-center gap-2 mt-4">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  <span className="text-xs text-muted-foreground">This may take a moment</span>
                </div>
              </motion.div>
            ) : importState === "success" ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="py-8 text-center"
              >
                <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="h-8 w-8 text-green-500" />
                </div>
                <p className="font-medium text-foreground mb-1">
                  Publications Imported!
                </p>
                <p className="text-sm text-muted-foreground">
                  Successfully imported {importedCount} research papers
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="form"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <Tabs value={activeSource} onValueChange={(v) => setActiveSource(v as ImportSource)} className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="orcid" className="gap-1.5">
                      <BookOpen className="h-3.5 w-3.5" />
                      ORCID
                    </TabsTrigger>
                    <TabsTrigger value="scopus" className="gap-1.5">
                      <FileSearch className="h-3.5 w-3.5" />
                      Scopus
                    </TabsTrigger>
                    <TabsTrigger value="scholar" className="gap-1.5">
                      <GraduationCap className="h-3.5 w-3.5" />
                      Scholar
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="orcid" className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">
                        ORCID iD
                      </label>
                      <Input
                        value={orcidInput}
                        onChange={(e) => setOrcidInput(e.target.value)}
                        placeholder="0000-0002-1825-0097"
                        className="font-mono text-sm"
                      />
                      <p className="text-xs text-muted-foreground">
                        Enter your 16-digit ORCID identifier
                      </p>
                    </div>
                    <div className="rounded-lg bg-green-500/5 border border-green-500/20 p-3">
                      <div className="flex items-start gap-2">
                        <BookOpen className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                        <div className="text-xs text-muted-foreground">
                          <p className="font-medium text-foreground mb-1">Free & Open Access</p>
                          <p>ORCID is a free service. Your works will be imported directly from the ORCID registry.</p>
                        </div>
                      </div>
                    </div>
                    {orcidId && (
                      <div className="flex items-center gap-2 text-sm text-green-600">
                        <CheckCircle className="h-4 w-4" />
                        <span>ORCID linked: {orcidId}</span>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="scopus" className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">
                        Scopus Profile URL
                      </label>
                      <Input
                        value={scopusInput}
                        onChange={(e) => setScopusInput(e.target.value)}
                        placeholder="https://www.scopus.com/authid/detail.uri?authorId=..."
                        className="text-sm"
                      />
                      <p className="text-xs text-muted-foreground">
                        Find your Scopus author profile and paste the URL
                      </p>
                    </div>
                    <div className="rounded-lg bg-orange-500/5 border border-orange-500/20 p-3">
                      <div className="flex items-start gap-2">
                        <FileSearch className="h-4 w-4 text-orange-600 mt-0.5 shrink-0" />
                        <div className="text-xs text-muted-foreground">
                          <p className="font-medium text-foreground mb-1">Scopus Integration</p>
                          <p>Publications, citations, and co-authors will be imported from Scopus.</p>
                        </div>
                      </div>
                    </div>
                    {scopusLink && (
                      <div className="flex items-center gap-2 text-sm text-green-600">
                        <CheckCircle className="h-4 w-4" />
                        <span>Scopus linked</span>
                        <a href={scopusLink} target="_blank" rel="noopener noreferrer" className="ml-auto hover:underline flex items-center gap-1">
                          View <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="scholar" className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">
                        Paste Publications
                      </label>
                      <Textarea
                        value={scholarInput}
                        onChange={(e) => setScholarInput(e.target.value)}
                        placeholder="Copy your publications list from Google Scholar and paste here..."
                        className="text-sm min-h-[150px] resize-none"
                      />
                      <p className="text-xs text-muted-foreground">
                        Go to your Google Scholar profile, select all publications text, and paste here
                      </p>
                    </div>
                    <div className="rounded-lg bg-blue-500/5 border border-blue-500/20 p-3">
                      <div className="flex items-start gap-2">
                        <GraduationCap className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
                        <div className="text-xs text-muted-foreground">
                          <p className="font-medium text-foreground mb-1">Manual Import</p>
                          <p>Copy your publications from Google Scholar and we'll parse them automatically.</p>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>

                <div className="flex gap-2 pt-4 mt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleImport}
                    disabled={isSaving || !getInputValue().trim()}
                    className="flex-1 gap-2"
                  >
                    {isSaving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="h-4 w-4" />
                    )}
                    {isConnected(activeSource) ? "Refresh" : "Import"} Publications
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </DialogContent>
      </Dialog>
    </>
  );
};
