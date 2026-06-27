import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageCircle,
  X,
  Send,
  Mic,
  MicOff,
  Bot,
  MapPin,
  Briefcase,
  Building2,
  Loader2,
  Volume2,
  VolumeX,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { JobWithRecruiter } from "@/hooks/useJobsWithRecruiters";

interface JobResult {
  id: string;
  title: string;
  institute: string;
  location: string;
  salary_range: string | null;
  job_type: string | null;
  tags: string[] | null;
  description: string | null;
  created_at: string;
}

interface ChatMessage {
  id: string;
  type: "user" | "bot";
  content: string;
  jobs?: JobResult[];
  timestamp: Date;
}

interface CandidateJobChatbotProps {
  onJobClick?: (job: JobWithRecruiter) => void;
}

const CandidateJobChatbot = ({ onJobClick }: CandidateJobChatbotProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      type: "bot",
      content:
        "Namaste! 👋 I'm your job-search assistant. Tell me what role you're looking for — e.g. 'Assistant Professor in Delhi' or 'remote data science jobs'. Hindi bhi chalega! Tap 🎤 to speak.",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceReplies, setVoiceReplies] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (typeof window === "undefined") return;
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    const rec = new SR();
    rec.continuous = false;
    rec.interimResults = false;
    rec.lang = "en-IN";
    rec.onresult = (e: any) => {
      const transcript = e.results[0][0].transcript;
      setInput(transcript);
      setIsListening(false);
      setTimeout(() => sendMessageInternal(transcript), 100);
    };
    rec.onerror = (e: any) => {
      setIsListening(false);
      if (e.error === "not-allowed") {
        toast({ title: "Mic blocked", description: "Enable microphone access to use voice.", variant: "destructive" });
      }
    };
    rec.onend = () => setIsListening(false);
    recognitionRef.current = rec;
  }, [toast]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  const speak = useCallback(
    (text: string) => {
      if (!voiceReplies || typeof window === "undefined" || !("speechSynthesis" in window)) return;
      try {
        window.speechSynthesis.cancel();
        const utt = new SpeechSynthesisUtterance(text);
        utt.lang = "en-IN";
        utt.rate = 1;
        window.speechSynthesis.speak(utt);
      } catch {
        /* noop */
      }
    },
    [voiceReplies]
  );

  const toggleListening = useCallback(() => {
    if (!recognitionRef.current) {
      toast({ title: "Voice unavailable", description: "Your browser doesn't support voice input.", variant: "destructive" });
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch {
        setIsListening(false);
      }
    }
  }, [isListening, toast]);

  const sendMessageInternal = async (raw: string) => {
    const text = raw.trim();
    if (!text || isLoading) return;
    const userMsg: ChatMessage = { id: Date.now().toString(), type: "user", content: text, timestamp: new Date() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      const history = messages
        .filter((m) => m.id !== "welcome")
        .slice(-8)
        .map((m) => ({ role: m.type === "user" ? "user" : "assistant", content: m.content }));

      const { data, error } = await supabase.functions.invoke("candidate-job-chat", {
        body: { message: text, conversationHistory: history },
      });
      if (error) throw error;

      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: "bot",
        content: data?.message || "Sorry, I couldn't process that.",
        jobs: data?.type === "jobs" ? data.jobs : undefined,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMsg]);
      speak(botMsg.content);
    } catch (err) {
      console.error("Chat error:", err);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          type: "bot",
          content: "Hmm, something went wrong. Please try again.",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = () => sendMessageInternal(input);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleJobOpen = (job: JobResult) => {
    if (onJobClick) {
      onJobClick({ ...job, recruiter: null } as JobWithRecruiter);
    }
  };

  return (
    <>
      <motion.div
        className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
      >
        <Button
          onClick={() => setIsOpen(!isOpen)}
          size="lg"
          className={cn(
            "h-12 w-12 sm:h-14 sm:w-14 rounded-full shadow-lg",
            isOpen ? "bg-destructive hover:bg-destructive/90" : "bg-primary hover:bg-primary/90"
          )}
          aria-label="Open job assistant"
        >
          <AnimatePresence mode="wait">
            {isOpen ? (
              <motion.div key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.2 }}>
                <X className="h-6 w-6" />
              </motion.div>
            ) : (
              <motion.div key="m" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.2 }}>
                <MessageCircle className="h-6 w-6" />
              </motion.div>
            )}
          </AnimatePresence>
        </Button>
      </motion.div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-20 right-2 sm:bottom-24 sm:right-6 z-50 w-[calc(100vw-1rem)] sm:w-[420px] sm:max-w-[calc(100vw-3rem)] max-h-[calc(100vh-6rem)] rounded-xl border bg-background shadow-2xl overflow-hidden flex flex-col"
          >
            <div className="bg-primary px-4 py-3 text-primary-foreground flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-foreground/20">
                  <Bot className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold">Job Assistant</h3>
                  <p className="text-xs text-primary-foreground/80">Find the right role with AI</p>
                </div>
              </div>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/10"
                onClick={() => setVoiceReplies((v) => !v)}
                aria-label="Toggle voice replies"
                title={voiceReplies ? "Mute voice replies" : "Enable voice replies"}
              >
                {voiceReplies ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
              </Button>
            </div>

            <ScrollArea ref={scrollRef as any} className="h-[50vh] sm:h-[400px] p-3 sm:p-4 flex-1">
              <div className="space-y-4">
                {messages.map((m) => (
                  <div key={m.id} className={cn("flex gap-3", m.type === "user" ? "justify-end" : "justify-start")}>
                    {m.type === "bot" && (
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                        <Bot className="h-4 w-4 text-primary" />
                      </div>
                    )}
                    <div
                      className={cn(
                        "rounded-lg px-3 py-2",
                        m.type === "user" ? "max-w-[80%] bg-primary text-primary-foreground" : "max-w-[95%] bg-muted"
                      )}
                    >
                      <p className="text-sm whitespace-pre-wrap">{m.content}</p>
                      {m.jobs && m.jobs.length > 0 && (
                        <div className="mt-3 space-y-2">
                          {m.jobs.map((j) => (
                            <Card
                              key={j.id}
                              className="p-3 bg-background border shadow-sm cursor-pointer hover:border-primary/40 transition"
                              onClick={() => handleJobOpen(j)}
                            >
                              <p className="font-semibold text-sm text-foreground line-clamp-1">{j.title}</p>
                              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Building2 className="h-3 w-3" /> {j.institute}
                                </span>
                                <span className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3" /> {j.location}
                                </span>
                                {j.job_type && (
                                  <span className="flex items-center gap-1">
                                    <Briefcase className="h-3 w-3" /> {j.job_type}
                                  </span>
                                )}
                              </div>
                              {j.tags && j.tags.length > 0 && (
                                <div className="mt-2 flex flex-wrap gap-1">
                                  {j.tags.slice(0, 4).map((t, i) => (
                                    <Badge key={i} variant="secondary" className="text-[10px] px-1.5 py-0.5">
                                      {t}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </Card>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                      <Bot className="h-4 w-4 text-primary" />
                    </div>
                    <div className="rounded-lg px-3 py-2 bg-muted flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-3 w-3 animate-spin" /> Thinking…
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            <div className="border-t p-3 flex items-center gap-2">
              <Button
                size="icon"
                variant={isListening ? "destructive" : "outline"}
                onClick={toggleListening}
                aria-label="Voice input"
                className="shrink-0"
              >
                {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </Button>
              <Input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={isListening ? "Listening…" : "Ask about jobs…"}
                disabled={isLoading}
              />
              <Button size="icon" onClick={sendMessage} disabled={isLoading || !input.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default CandidateJobChatbot;
