import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  MessageCircle, 
  X, 
  Send, 
  Mic, 
  MicOff, 
  User, 
  Bot, 
  MapPin, 
  Briefcase,
  Mail,
  Eye,
  Loader2,
  ChevronDown,
  Crown,
  Medal,
  Award
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface Candidate {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  role: string | null;
  headline: string | null;
  university: string | null;
  location: string | null;
  years_experience: number | null;
  skills: string[] | null;
  email: string | null;
  matchReasons?: string[];
  score?: number;
  category?: string;
}

interface ChatMessage {
  id: string;
  type: "user" | "bot";
  content: string;
  candidates?: Candidate[];
  timestamp: Date;
  hasMore?: boolean;
  searchCriteria?: any;
  shownCandidateIds?: string[];
  totalMatches?: number;
}

interface RecruiterChatbotProps {
  onViewCandidate: (candidate: any) => void;
  onMessageCandidate: (candidate: any) => void;
}

const getCategoryIcon = (category: string) => {
  switch (category) {
    case "GOLD":
      return <Crown className="h-3 w-3 text-yellow-500" />;
    case "SILVER":
      return <Medal className="h-3 w-3 text-gray-400" />;
    case "BRONZE":
      return <Award className="h-3 w-3 text-amber-600" />;
    default:
      return null;
  }
};

const getCategoryBadgeStyle = (category: string) => {
  switch (category) {
    case "GOLD":
      return "bg-yellow-500/10 text-yellow-600 border-yellow-500/30";
    case "SILVER":
      return "bg-gray-400/10 text-gray-500 border-gray-400/30";
    case "BRONZE":
      return "bg-amber-600/10 text-amber-700 border-amber-600/30";
    default:
      return "bg-muted text-muted-foreground";
  }
};

const RecruiterChatbot = ({ onViewCandidate, onMessageCandidate }: RecruiterChatbotProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      type: "bot",
      content: "Hello! 👋 How can I help you today? You can speak in Hindi or English! Try 'I need a Manager for HR' or 'mujhe HR ka manager chahiye'. You can also ask for contact info like 'get me email of John'.",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const { toast } = useToast();

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== "undefined" && ("SpeechRecognition" in window || "webkitSpeechRecognition" in window)) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = "en-IN"; // English output, understands Hindi-accented English too

      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        setIsListening(false);
      };

      recognitionRef.current.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        setIsListening(false);
        if (event.error === "not-allowed") {
          toast({
            title: "Microphone Access Denied",
            description: "Please enable microphone access to use voice input.",
            variant: "destructive",
          });
        }
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, [toast]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const toggleListening = useCallback(() => {
    if (!recognitionRef.current) {
      toast({
        title: "Voice Input Unavailable",
        description: "Your browser doesn't support voice input. Please type your message instead.",
        variant: "destructive",
      });
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (error) {
        console.error("Failed to start speech recognition:", error);
        setIsListening(false);
      }
    }
  }, [isListening, toast]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("recruiter-chat", {
        body: { message: userMessage.content },
      });

      if (error) throw error;

      const candidateIds = data.type === "candidates" 
        ? data.candidates?.map((c: Candidate) => c.id) || []
        : [];

      const botMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: "bot",
        content: data.message || "I'm sorry, I couldn't process that request.",
        candidates: data.type === "candidates" ? data.candidates : undefined,
        hasMore: data.hasMore,
        searchCriteria: data.searchCriteria,
        shownCandidateIds: candidateIds,
        totalMatches: data.totalMatches,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error("Chat error:", error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: "bot",
        content: "Sorry, I encountered an error. Please try again.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleShowMore = async (messageId: string) => {
    const message = messages.find(m => m.id === messageId);
    if (!message || !message.searchCriteria || !message.shownCandidateIds) return;

    setLoadingMore(true);

    try {
      // Get the original search message (user message before this bot message)
      const messageIndex = messages.findIndex(m => m.id === messageId);
      const userMessageBefore = messages.slice(0, messageIndex).reverse().find(m => m.type === "user");
      
      if (!userMessageBefore) {
        throw new Error("Could not find original search query");
      }

      const { data, error } = await supabase.functions.invoke("recruiter-chat", {
        body: { 
          message: userMessageBefore.content,
          showMore: true,
          previousCandidateIds: message.shownCandidateIds,
        },
      });

      if (error) throw error;

      if (data.type === "candidates" && data.candidates?.length > 0) {
        const newCandidateIds = data.candidates.map((c: Candidate) => c.id);
        const allShownIds = [...(message.shownCandidateIds || []), ...newCandidateIds];

        const moreResultsMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          type: "bot",
          content: data.message,
          candidates: data.candidates,
          hasMore: data.hasMore,
          searchCriteria: data.searchCriteria,
          shownCandidateIds: allShownIds,
          totalMatches: data.totalMatches,
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, moreResultsMessage]);
      } else {
        const noMoreMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          type: "bot",
          content: "No more candidates available for this search.",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, noMoreMessage]);
      }
    } catch (error) {
      console.error("Show more error:", error);
      toast({
        title: "Error",
        description: "Failed to load more candidates. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoadingMore(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleViewProfile = (candidate: Candidate) => {
    onViewCandidate({
      id: candidate.id,
      full_name: candidate.full_name,
      avatar_url: candidate.avatar_url,
      role: candidate.role,
      headline: candidate.headline,
      university: candidate.university,
      location: candidate.location,
      years_experience: candidate.years_experience,
      skills: candidate.skills,
      email: candidate.email,
    });
  };

  const handleSendMessage = (candidate: Candidate) => {
    onMessageCandidate({
      id: candidate.id,
      full_name: candidate.full_name,
      email: candidate.email,
    });
  };

  return (
    <>
      {/* Floating Action Button */}
      <motion.div
        className="fixed bottom-6 right-6 z-50"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
      >
        <Button
          onClick={() => setIsOpen(!isOpen)}
          size="lg"
          className={cn(
            "h-14 w-14 rounded-full shadow-lg",
            isOpen ? "bg-destructive hover:bg-destructive/90" : "bg-primary hover:bg-primary/90"
          )}
        >
          <AnimatePresence mode="wait">
            {isOpen ? (
              <motion.div
                key="close"
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <X className="h-6 w-6" />
              </motion.div>
            ) : (
              <motion.div
                key="open"
                initial={{ rotate: 90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: -90, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <MessageCircle className="h-6 w-6" />
              </motion.div>
            )}
          </AnimatePresence>
        </Button>
      </motion.div>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-24 right-6 z-50 w-[420px] max-w-[calc(100vw-3rem)] rounded-xl border bg-background shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="bg-primary px-4 py-3 text-primary-foreground">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-foreground/20">
                  <Bot className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold">Recruiting Assistant</h3>
                  <p className="text-xs text-primary-foreground/80">AI-powered candidate search</p>
                </div>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea ref={scrollRef} className="h-[400px] p-4">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      "flex gap-3",
                      message.type === "user" ? "justify-end" : "justify-start"
                    )}
                  >
                    {message.type === "bot" && (
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                        <Bot className="h-4 w-4 text-primary" />
                      </div>
                    )}
                    <div
                      className={cn(
                        "rounded-lg px-3 py-2",
                        message.type === "user"
                          ? "max-w-[80%] bg-primary text-primary-foreground"
                          : "max-w-[95%] bg-muted"
                      )}
                    >
                      <p className="text-sm">{message.content}</p>
                      
                      {/* Candidate Results */}
                      {message.candidates && message.candidates.length > 0 && (
                        <div className="mt-3 space-y-2">
                          {message.candidates.map((candidate) => (
                            <Card key={candidate.id} className="p-3 bg-background border shadow-sm">
                              <div className="flex items-start gap-3">
                                <Avatar className="h-12 w-12 border-2 border-primary/20">
                                  <AvatarImage src={candidate.avatar_url || undefined} />
                                  <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                                    {candidate.full_name?.charAt(0) || "C"}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <p className="font-semibold text-sm text-foreground">
                                      {candidate.full_name || "Unknown"}
                                    </p>
                                    {candidate.category && candidate.category !== "FRESHER" && (
                                      <Badge 
                                        variant="outline" 
                                        className={cn("text-[10px] px-1.5 py-0.5 flex items-center gap-1 shrink-0", getCategoryBadgeStyle(candidate.category))}
                                      >
                                        {getCategoryIcon(candidate.category)}
                                        {candidate.category}
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-xs text-primary font-medium mt-0.5 line-clamp-2">
                                    {candidate.role || candidate.headline || "No role specified"}
                                  </p>
                                  <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                                    {candidate.location && (
                                      <div className="flex items-center gap-1">
                                        <MapPin className="h-3 w-3" />
                                        <span className="truncate max-w-[100px]">{candidate.location}</span>
                                      </div>
                                    )}
                                    {candidate.years_experience !== null && candidate.years_experience > 0 && (
                                      <div className="flex items-center gap-1">
                                        <Briefcase className="h-3 w-3" />
                                        <span>{candidate.years_experience} yrs</span>
                                      </div>
                                    )}
                                  </div>
                                  {candidate.matchReasons && candidate.matchReasons.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mt-2">
                                      {candidate.matchReasons.slice(0, 2).map((reason, idx) => (
                                        <Badge key={idx} variant="secondary" className="text-[10px] px-1.5 py-0.5 bg-primary/5 text-primary border-0">
                                          {reason}
                                        </Badge>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-2 mt-3">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-8 text-xs font-medium"
                                  onClick={() => handleViewProfile(candidate)}
                                >
                                  <Eye className="h-3.5 w-3.5 mr-1.5" />
                                  View Profile
                                </Button>
                                <Button
                                  size="sm"
                                  className="h-8 text-xs font-medium"
                                  onClick={() => handleSendMessage(candidate)}
                                >
                                  <Mail className="h-3.5 w-3.5 mr-1.5" />
                                  Message
                                </Button>
                              </div>
                            </Card>
                          ))}
                          
                          {/* Show More Button */}
                          {message.hasMore && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full mt-2"
                              onClick={() => handleShowMore(message.id)}
                              disabled={loadingMore}
                            >
                              {loadingMore ? (
                                <>
                                  <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                                  Loading...
                                </>
                              ) : (
                                <>
                                  <ChevronDown className="h-3 w-3 mr-2" />
                                  Show More Candidates
                                </>
                              )}
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                    {message.type === "user" && (
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary">
                        <User className="h-4 w-4 text-primary-foreground" />
                      </div>
                    )}
                  </div>
                ))}
                {isLoading && (
                  <div className="flex gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                      <Bot className="h-4 w-4 text-primary" />
                    </div>
                    <div className="bg-muted rounded-lg px-3 py-2">
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-sm text-muted-foreground">Searching candidates...</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Input */}
            <div className="border-t p-3">
              <div className="flex gap-2">
                <Button
                  variant={isListening ? "destructive" : "outline"}
                  size="icon"
                  className="shrink-0"
                  onClick={toggleListening}
                  disabled={isLoading}
                >
                  {isListening ? (
                    <MicOff className="h-4 w-4" />
                  ) : (
                    <Mic className="h-4 w-4" />
                  )}
                </Button>
                <Input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={isListening ? "सुन रहा हूँ... Listening..." : "Type in Hindi or English..."}
                  disabled={isLoading || isListening}
                  className="flex-1"
                />
                <Button
                  size="icon"
                  onClick={sendMessage}
                  disabled={!input.trim() || isLoading}
                  className="shrink-0"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              {isListening && (
                <p className="text-xs text-muted-foreground mt-2 text-center animate-pulse">
                  🎤 Listening... Speak now
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default RecruiterChatbot;
