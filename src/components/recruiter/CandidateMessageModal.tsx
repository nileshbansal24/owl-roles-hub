import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  Mail, 
  Send, 
  Loader2, 
  FileText, 
  Calendar, 
  MessageSquare,
  Sparkles,
  User
} from "lucide-react";

interface CandidateMessageModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  candidateName: string;
  candidateEmail: string;
  candidateId: string;
  recruiterId: string;
  jobId?: string;
  jobTitle?: string;
  instituteName?: string;
}

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  icon: typeof Mail;
}

const emailTemplates: EmailTemplate[] = [
  {
    id: "interest",
    name: "Express Interest",
    subject: "Interested in Your Profile - {{jobTitle}}",
    body: `Dear {{candidateName}},

I came across your profile on OWL ROLES and was impressed by your qualifications and experience. 

We are currently looking to fill the position of {{jobTitle}} at {{instituteName}}, and I believe your background would be an excellent fit for our team.

Would you be interested in discussing this opportunity further? I would love to schedule a brief call to learn more about your career goals and share more details about the position.

Please let me know your availability, and I'll be happy to arrange a convenient time.

Best regards,
{{recruiterName}}
{{instituteName}}`,
    icon: Sparkles,
  },
  {
    id: "interview",
    name: "Interview Invitation",
    subject: "Interview Invitation - {{jobTitle}} at {{instituteName}}",
    body: `Dear {{candidateName}},

Thank you for your interest in the {{jobTitle}} position at {{instituteName}}. After reviewing your application, we would like to invite you for an interview.

We are excited to learn more about your experience and discuss how you might contribute to our institution.

Please reply to this email with your availability for the coming week, and we will schedule a time that works best for you.

We look forward to speaking with you soon.

Best regards,
{{recruiterName}}
{{instituteName}}`,
    icon: Calendar,
  },
  {
    id: "followup",
    name: "Follow Up",
    subject: "Following Up - {{jobTitle}} Position",
    body: `Dear {{candidateName}},

I hope this message finds you well. I wanted to follow up regarding the {{jobTitle}} position at {{instituteName}}.

We remain very interested in your candidacy and would love to continue our conversation. Please let me know if you have any questions or if there's anything else you need from us.

Looking forward to hearing from you.

Best regards,
{{recruiterName}}
{{instituteName}}`,
    icon: MessageSquare,
  },
  {
    id: "custom",
    name: "Custom Message",
    subject: "",
    body: "",
    icon: FileText,
  },
];

const CandidateMessageModal = ({
  open,
  onOpenChange,
  candidateName,
  candidateEmail,
  candidateId,
  recruiterId,
  jobId,
  jobTitle = "Open Position",
  instituteName = "Our Institution",
}: CandidateMessageModalProps) => {
  const { toast } = useToast();
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [recruiterName, setRecruiterName] = useState("");

  const applyTemplate = (template: EmailTemplate) => {
    setSelectedTemplate(template.id);
    
    if (template.id === "custom") {
      setSubject("");
      setBody("");
      return;
    }

    // Replace placeholders
    const replacePlaceholders = (text: string) => {
      return text
        .replace(/\{\{candidateName\}\}/g, candidateName || "Candidate")
        .replace(/\{\{jobTitle\}\}/g, jobTitle)
        .replace(/\{\{instituteName\}\}/g, instituteName)
        .replace(/\{\{recruiterName\}\}/g, recruiterName || "[Your Name]");
    };

    setSubject(replacePlaceholders(template.subject));
    setBody(replacePlaceholders(template.body));
  };

  const handleSend = async () => {
    if (!subject.trim() || !body.trim()) {
      toast({
        title: "Missing fields",
        description: "Please fill in both subject and message.",
        variant: "destructive",
      });
      return;
    }

    if (!candidateEmail) {
      toast({
        title: "Email not available",
        description: "This candidate's email is not available.",
        variant: "destructive",
      });
      return;
    }

    setSending(true);

    try {
      const { error } = await supabase.functions.invoke("send-recruiter-message", {
        body: {
          to: candidateEmail,
          subject,
          message: body,
          candidateName,
          candidateId,
          recruiterId,
          jobId,
          jobTitle,
        },
      });

      if (error) throw error;

      toast({
        title: "Message sent!",
        description: `Your message has been sent to ${candidateName}.`,
      });

      onOpenChange(false);
      resetForm();
    } catch (error: any) {
      console.error("Error sending message:", error);
      toast({
        title: "Failed to send",
        description: error.message || "There was an error sending your message.",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const resetForm = () => {
    setSelectedTemplate(null);
    setSubject("");
    setBody("");
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) resetForm(); }}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            Send Message to {candidateName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Recipient Info */}
          <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-medium text-sm">{candidateName}</p>
              <p className="text-xs text-muted-foreground">{candidateEmail || "Email not available"}</p>
            </div>
          </div>

          {/* Template Selection */}
          <div className="space-y-2">
            <Label>Choose a Template</Label>
            <div className="grid grid-cols-2 gap-2">
              {emailTemplates.map((template) => (
                <button
                  key={template.id}
                  onClick={() => applyTemplate(template)}
                  className={`flex items-center gap-2 p-3 rounded-lg border text-left transition-all ${
                    selectedTemplate === template.id
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <template.icon className={`h-4 w-4 ${
                    selectedTemplate === template.id ? "text-primary" : "text-muted-foreground"
                  }`} />
                  <span className={`text-sm font-medium ${
                    selectedTemplate === template.id ? "text-primary" : "text-foreground"
                  }`}>
                    {template.name}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Your Name (for template) */}
          {selectedTemplate && selectedTemplate !== "custom" && (
            <div className="space-y-2">
              <Label htmlFor="recruiterName">Your Name (for signature)</Label>
              <Input
                id="recruiterName"
                placeholder="Enter your name"
                value={recruiterName}
                onChange={(e) => {
                  setRecruiterName(e.target.value);
                  // Re-apply template with new name
                  const template = emailTemplates.find(t => t.id === selectedTemplate);
                  if (template) {
                    setBody(body.replace(/\[Your Name\]/g, e.target.value || "[Your Name]"));
                  }
                }}
              />
            </div>
          )}

          {/* Subject */}
          <div className="space-y-2">
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              placeholder="Email subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>

          {/* Message Body */}
          <div className="space-y-2">
            <Label htmlFor="body">Message</Label>
            <Textarea
              id="body"
              placeholder="Write your message..."
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={10}
              className="resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              className="flex-1 gap-2"
              onClick={handleSend}
              disabled={sending || !candidateEmail}
            >
              {sending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Send Message
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CandidateMessageModal;
