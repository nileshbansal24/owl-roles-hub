import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  Sparkles, 
  FileText, 
  Hash,
  Loader2,
  Lightbulb
} from "lucide-react";
import { staggerItemVariants } from "@/components/ui/fade-in";
import type { Profile } from "@/types/recruiter";

interface SmartCandidateSearchProps {
  candidates: Profile[];
  onSearchResults: (results: Profile[]) => void;
  onSearching: (isSearching: boolean) => void;
}

// Helper function to parse keywords and extract search criteria
const parseKeywords = (input: string): { roles: string[]; experience: number | null; salary: number | null; keywords: string[] } => {
  const result = { roles: [] as string[], experience: null as number | null, salary: null as number | null, keywords: [] as string[] };
  
  const lower = input.toLowerCase().trim();
  
  // First, try comma-separated parsing
  const parts = lower.split(/[,;]+/).map(p => p.trim()).filter(Boolean);
  
  for (const part of parts) {
    // Check for experience patterns
    const expMatch = part.match(/(\d+)\+?\s*years?\s*(?:experience|exp)?/i) || 
                     part.match(/(?:experience|exp)\s*:?\s*(\d+)\+?\s*years?/i);
    if (expMatch) {
      result.experience = parseInt(expMatch[1]);
      continue;
    }
    
    // Check for salary patterns
    const salaryMatch = part.match(/(?:salary|ctc|compensation)?\s*(?:under|below|less than|<)?\s*(\d+)\s*(?:lpa|lakhs?|l)/i);
    if (salaryMatch) {
      result.salary = parseInt(salaryMatch[1]);
      continue;
    }
    
    // Common academic roles
    const roleKeywords = ['dean', 'professor', 'hod', 'director', 'principal', 'lecturer', 'researcher', 'vice chancellor', 'chancellor', 'head', 'coordinator', 'manager'];
    const isRole = roleKeywords.some(role => part.includes(role));
    if (isRole) {
      result.roles.push(part);
    }
    
    // Also add as keyword for flexible matching
    if (part.length > 2) {
      result.keywords.push(part);
    }
  }
  
  // If no commas were used, treat the whole input as search terms
  if (parts.length <= 1 && lower.length > 0) {
    // Split by spaces and add each word
    const words = lower.split(/\s+/).filter(w => w.length > 2);
    for (const word of words) {
      const roleKeywords = ['dean', 'professor', 'hod', 'director', 'principal', 'lecturer', 'researcher', 'chancellor', 'head', 'coordinator', 'manager'];
      if (roleKeywords.includes(word)) {
        result.roles.push(word);
      }
      result.keywords.push(word);
    }
  }
  
  return result;
};

// Helper function to parse natural language query
const parseNaturalLanguage = (input: string): { roles: string[]; experience: number | null; keywords: string[] } => {
  const result = { roles: [] as string[], experience: null as number | null, keywords: [] as string[] };
  
  const lower = input.toLowerCase();
  
  // Extract experience
  const expMatch = lower.match(/(\d+)\+?\s*years?\s*(?:of\s*)?(?:experience|exp)?/i);
  if (expMatch) {
    result.experience = parseInt(expMatch[1]);
  }
  
  // Extract common roles
  const rolePatterns = [
    /\b(vice\s*chancellor)\b/gi,
    /\b(dean(?:\s*(?:of|for|-)\s*\w+)?)\b/gi,
    /\b(professor)\b/gi,
    /\b(hod|head\s*of\s*department)\b/gi,
    /\b(director)\b/gi,
    /\b(principal)\b/gi,
    /\b(lecturer)\b/gi,
    /\b(researcher)\b/gi,
  ];
  
  for (const pattern of rolePatterns) {
    const matches = lower.match(pattern);
    if (matches) {
      result.roles.push(...matches.map(m => m.trim()));
    }
  }
  
  // Extract keywords related to specialization
  const specializationPatterns = ['research', 'teaching', 'academic', 'administration', 'engineering', 'science', 'arts', 'commerce', 'management', 'technology'];
  for (const spec of specializationPatterns) {
    if (lower.includes(spec) && !result.roles.some(r => r.includes(spec))) {
      result.keywords.push(spec);
    }
  }
  
  return result;
};

// Helper function to parse job description
const parseJobDescription = (jd: string): { roles: string[]; experience: number | null; skills: string[]; keywords: string[] } => {
  const result = { roles: [] as string[], experience: null as number | null, skills: [] as string[], keywords: [] as string[] };
  
  const lower = jd.toLowerCase();
  
  // Extract experience requirements
  const expPatterns = [
    /(\d+)\+?\s*years?\s*(?:of\s*)?(?:experience|exp)/gi,
    /minimum\s*(?:of\s*)?(\d+)\s*years?/gi,
    /(?:experience|exp)\s*:?\s*(\d+)\+?\s*years?/gi,
  ];
  
  for (const pattern of expPatterns) {
    const match = lower.match(pattern);
    if (match) {
      const numMatch = match[0].match(/(\d+)/);
      if (numMatch) {
        result.experience = parseInt(numMatch[1]);
        break;
      }
    }
  }
  
  // Extract job titles/roles
  const rolePatterns = [
    /(?:position|role|title)\s*:?\s*([^\n,.]+)/gi,
    /(?:looking for|hiring|seeking)\s*(?:a|an)?\s*([^\n,.]+)/gi,
  ];
  
  for (const pattern of rolePatterns) {
    const matches = lower.matchAll(pattern);
    for (const match of matches) {
      if (match[1] && match[1].length < 50) {
        result.roles.push(match[1].trim());
      }
    }
  }
  
  // Common academic roles detection
  const academicRoles = ['dean', 'professor', 'hod', 'director', 'principal', 'lecturer', 'researcher', 'vice chancellor', 'head of department', 'coordinator'];
  for (const role of academicRoles) {
    if (lower.includes(role)) {
      result.roles.push(role);
    }
  }
  
  // Extract skills from common patterns
  const skillPatterns = [
    /skills?\s*:?\s*([^\n]+)/gi,
    /requirements?\s*:?\s*([^\n]+)/gi,
    /qualifications?\s*:?\s*([^\n]+)/gi,
  ];
  
  for (const pattern of skillPatterns) {
    const matches = lower.matchAll(pattern);
    for (const match of matches) {
      const skills = match[1].split(/[,;]/).map(s => s.trim()).filter(s => s.length > 2 && s.length < 30);
      result.skills.push(...skills);
    }
  }
  
  // Extract keywords
  const importantWords = lower.match(/\b[a-z]{4,}\b/g) || [];
  const stopWords = new Set(['that', 'this', 'with', 'from', 'have', 'will', 'been', 'were', 'being', 'about', 'would', 'could', 'should', 'their', 'there', 'which', 'other']);
  result.keywords = [...new Set(importantWords.filter(w => !stopWords.has(w)))].slice(0, 20);
  
  return result;
};

const SmartCandidateSearch = ({
  candidates,
  onSearchResults,
  onSearching,
}: SmartCandidateSearchProps) => {
  const [activeSearchTab, setActiveSearchTab] = useState("keyword");
  const [keywordInput, setKeywordInput] = useState("");
  const [smartTextInput, setSmartTextInput] = useState("");
  const [jdInput, setJdInput] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const performSearch = useCallback((
    criteria: { roles: string[]; experience: number | null; salary?: number | null; skills?: string[]; keywords: string[] }
  ) => {
    // If no criteria, return empty
    if (criteria.roles.length === 0 && criteria.experience === null && 
        (!criteria.skills || criteria.skills.length === 0) && criteria.keywords.length === 0) {
      return [];
    }

    const results = candidates.map(candidate => {
      let score = 0;
      
      const candidateRole = (candidate.role || '').toLowerCase();
      const candidateHeadline = (candidate.headline || '').toLowerCase();
      const candidateBio = (candidate.bio || '').toLowerCase();
      const candidateSummary = (candidate.professional_summary || '').toLowerCase();
      const candidateSkillsText = (candidate.skills || []).join(' ').toLowerCase();
      
      const searchableText = `${candidateRole} ${candidateHeadline} ${candidateBio} ${candidateSummary} ${candidateSkillsText}`;
      
      // Role matching - be more flexible
      if (criteria.roles.length > 0) {
        for (const role of criteria.roles) {
          const roleLower = role.toLowerCase().trim();
          if (searchableText.includes(roleLower)) {
            score += 5;
          }
        }
      }
      
      // Also check all keywords against the searchable text
      if (criteria.keywords.length > 0) {
        for (const keyword of criteria.keywords) {
          const kwLower = keyword.toLowerCase().trim();
          if (searchableText.includes(kwLower)) {
            score += 2;
          }
        }
      }
      
      // Experience matching
      if (criteria.experience !== null && candidate.years_experience !== null) {
        if (candidate.years_experience >= criteria.experience) {
          score += 3;
        }
      }
      
      // Skills matching
      if (criteria.skills && criteria.skills.length > 0 && candidate.skills) {
        const candidateSkills = candidate.skills.map(s => s.toLowerCase());
        for (const skill of criteria.skills) {
          const skillLower = skill.toLowerCase().trim();
          if (candidateSkills.some(cs => cs.includes(skillLower) || skillLower.includes(cs))) {
            score += 2;
          }
        }
      }
      
      return { candidate, score };
    }).filter(item => item.score > 0);
    
    // Sort by score descending
    return results
      .sort((a, b) => b.score - a.score)
      .map(item => item.candidate);
  }, [candidates]);

  const handleKeywordSearch = useCallback(() => {
    if (!keywordInput.trim()) return;
    
    setIsSearching(true);
    onSearching(true);
    
    // Simulate a brief delay for UX
    setTimeout(() => {
      const parsed = parseKeywords(keywordInput);
      const results = performSearch(parsed);
      onSearchResults(results);
      setIsSearching(false);
      onSearching(false);
    }, 500);
  }, [keywordInput, performSearch, onSearchResults, onSearching]);

  const handleSmartTextSearch = useCallback(() => {
    if (!smartTextInput.trim()) return;
    
    setIsSearching(true);
    onSearching(true);
    
    setTimeout(() => {
      const parsed = parseNaturalLanguage(smartTextInput);
      const results = performSearch(parsed);
      onSearchResults(results);
      setIsSearching(false);
      onSearching(false);
    }, 500);
  }, [smartTextInput, performSearch, onSearchResults, onSearching]);

  const handleJDSearch = useCallback(() => {
    if (!jdInput.trim()) return;
    
    setIsSearching(true);
    onSearching(true);
    
    setTimeout(() => {
      const parsed = parseJobDescription(jdInput);
      const results = performSearch(parsed);
      onSearchResults(results);
      setIsSearching(false);
      onSearching(false);
    }, 800);
  }, [jdInput, performSearch, onSearchResults, onSearching]);

  return (
    <motion.div variants={staggerItemVariants} className="card-elevated p-6 border-2 border-primary/20">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Sparkles className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="font-heading font-semibold text-xl">Smart Candidate Search</h3>
          <p className="text-sm text-muted-foreground">
            Find the perfect candidates using keywords, natural language, or job descriptions
          </p>
        </div>
      </div>

      <Tabs value={activeSearchTab} onValueChange={setActiveSearchTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-4">
          <TabsTrigger value="keyword" className="gap-2">
            <Hash className="h-4 w-4" />
            Keyword Search
          </TabsTrigger>
          <TabsTrigger value="smart" className="gap-2">
            <Lightbulb className="h-4 w-4" />
            Smart Text
          </TabsTrigger>
          <TabsTrigger value="jd" className="gap-2">
            <FileText className="h-4 w-4" />
            JD Search
          </TabsTrigger>
        </TabsList>

        {/* Keyword Search */}
        <TabsContent value="keyword" className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Enter keywords separated by commas (e.g., "vice chancellor, 15+ years experience, salary under 50lpa")
            </p>
            <div className="flex gap-3">
              <Input
                placeholder="e.g., Dean, 10+ years experience, research, management"
                value={keywordInput}
                onChange={(e) => setKeywordInput(e.target.value)}
                className="flex-1 h-12"
                onKeyDown={(e) => e.key === 'Enter' && handleKeywordSearch()}
              />
              <Button 
                onClick={handleKeywordSearch} 
                disabled={!keywordInput.trim() || isSearching}
                className="h-12 px-6"
              >
                {isSearching ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Search className="h-4 w-4 mr-2" />
                    Search
                  </>
                )}
              </Button>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="text-xs text-muted-foreground">Quick add:</span>
            {["Vice Chancellor", "Dean", "15+ years", "Research", "Professor", "HOD"].map((tag) => (
              <Badge 
                key={tag}
                variant="outline" 
                className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors text-xs"
                onClick={() => setKeywordInput(prev => prev ? `${prev}, ${tag}` : tag)}
              >
                + {tag}
              </Badge>
            ))}
          </div>
        </TabsContent>

        {/* Smart Text Search */}
        <TabsContent value="smart" className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Describe who you're looking for in plain English
            </p>
            <div className="flex gap-3">
              <Input
                placeholder="e.g., I need a dean for research having 15 years experience"
                value={smartTextInput}
                onChange={(e) => setSmartTextInput(e.target.value)}
                className="flex-1 h-12"
                onKeyDown={(e) => e.key === 'Enter' && handleSmartTextSearch()}
              />
              <Button 
                onClick={handleSmartTextSearch} 
                disabled={!smartTextInput.trim() || isSearching}
                className="h-12 px-6"
              >
                {isSearching ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Search
                  </>
                )}
              </Button>
            </div>
          </div>
          <div className="bg-muted/50 rounded-lg p-3 text-sm text-muted-foreground">
            <strong className="text-foreground">Examples:</strong>
            <ul className="list-disc list-inside mt-1 space-y-1">
              <li>"Looking for a professor with 10 years of teaching experience"</li>
              <li>"Need a head of department for engineering with research background"</li>
              <li>"Find me a director with management and academic experience"</li>
            </ul>
          </div>
        </TabsContent>

        {/* JD Search */}
        <TabsContent value="jd" className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Paste your job description and we'll find matching candidates
            </p>
            <Textarea
              placeholder="Paste the complete job description here..."
              value={jdInput}
              onChange={(e) => setJdInput(e.target.value)}
              className="min-h-[150px] resize-none"
            />
            <Button 
              onClick={handleJDSearch} 
              disabled={!jdInput.trim() || isSearching}
              className="w-full h-12"
            >
              {isSearching ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Analyzing Job Description...
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4 mr-2" />
                  Find Matching Candidates
                </>
              )}
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
};

export default SmartCandidateSearch;
