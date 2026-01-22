import * as React from "react";
import { motion } from "framer-motion";
import { 
  User, 
  Users, 
  Mail, 
  Phone, 
  Sparkles, 
  Heart, 
  Quote, 
  BookOpen,
  Edit2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface PersonalDetailsCardProps {
  name?: string | null;
  familyDetails?: string | null;
  email?: string | null;
  phone?: string | null;
  skills?: string[] | null;
  hobbies?: string[] | null;
  quotes?: string | null;
  recommendedBooks?: string[] | null;
  onEdit?: () => void;
}

interface DetailItemProps {
  icon: React.ReactNode;
  label: string;
  value?: string | null;
  children?: React.ReactNode;
}

const DetailItem = ({ icon, label, value, children }: DetailItemProps) => (
  <div className="flex flex-col gap-1.5">
    <div className="flex items-center gap-2 text-muted-foreground">
      {icon}
      <span className="text-xs font-medium uppercase tracking-wide">{label}</span>
    </div>
    {children || (
      <p className="text-sm font-medium text-foreground pl-6">
        {value || <span className="text-muted-foreground/60 italic">Not specified</span>}
      </p>
    )}
  </div>
);

export const PersonalDetailsCard = ({
  name,
  familyDetails,
  email,
  phone,
  skills,
  hobbies,
  quotes,
  recommendedBooks,
  onEdit,
}: PersonalDetailsCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="bg-card rounded-2xl border border-border shadow-card overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border/50 bg-secondary/20">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-primary/10">
            <User className="h-4 w-4 text-primary" />
          </div>
          <h3 className="font-heading font-semibold text-base text-foreground">
            Personal Details
          </h3>
        </div>
        {onEdit && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onEdit}
            className="h-8 px-3 text-muted-foreground hover:text-foreground"
          >
            <Edit2 className="h-3.5 w-3.5 mr-1.5" />
            Edit
          </Button>
        )}
      </div>

      {/* Content - Horizontal Grid */}
      <div className="p-5">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {/* Name */}
          <DetailItem
            icon={<User className="h-4 w-4" />}
            label="Full Name"
            value={name}
          />

          {/* Family Details */}
          <DetailItem
            icon={<Users className="h-4 w-4" />}
            label="Family Details"
            value={familyDetails}
          />

          {/* Email */}
          <DetailItem
            icon={<Mail className="h-4 w-4" />}
            label="Email"
          >
            {email ? (
              <a 
                href={`mailto:${email}`} 
                className="text-sm font-medium text-primary hover:underline pl-6"
              >
                {email}
              </a>
            ) : (
              <p className="text-sm text-muted-foreground/60 italic pl-6">Not specified</p>
            )}
          </DetailItem>

          {/* Phone */}
          <DetailItem
            icon={<Phone className="h-4 w-4" />}
            label="Phone"
          >
            {phone ? (
              <a 
                href={`tel:${phone}`} 
                className="text-sm font-medium text-primary hover:underline pl-6"
              >
                {phone}
              </a>
            ) : (
              <p className="text-sm text-muted-foreground/60 italic pl-6">Not specified</p>
            )}
          </DetailItem>
        </div>

        {/* Second Row - Larger items */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 pt-6 border-t border-border/50">
          {/* Other Skills */}
          <DetailItem
            icon={<Sparkles className="h-4 w-4" />}
            label="Other Skills"
          >
            <div className="pl-6 mt-1">
              {skills && skills.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {skills.slice(0, 8).map((skill, idx) => (
                    <Badge 
                      key={idx} 
                      variant="secondary" 
                      className="text-xs font-normal"
                    >
                      {skill}
                    </Badge>
                  ))}
                  {skills.length > 8 && (
                    <Badge variant="outline" className="text-xs font-normal">
                      +{skills.length - 8} more
                    </Badge>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground/60 italic">No skills added</p>
              )}
            </div>
          </DetailItem>

          {/* Hobbies */}
          <DetailItem
            icon={<Heart className="h-4 w-4" />}
            label="Hobbies & Interests"
          >
            <div className="pl-6 mt-1">
              {hobbies && hobbies.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {hobbies.map((hobby, idx) => (
                    <Badge 
                      key={idx} 
                      variant="outline" 
                      className="text-xs font-normal border-primary/30 text-primary"
                    >
                      {hobby}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground/60 italic">No hobbies added</p>
              )}
            </div>
          </DetailItem>
        </div>

        {/* Third Row - Quote and Books */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 pt-6 border-t border-border/50">
          {/* Favorite Quote */}
          <DetailItem
            icon={<Quote className="h-4 w-4" />}
            label="Favorite Quote"
          >
            <div className="pl-6 mt-1">
              {quotes ? (
                <blockquote className="text-sm italic text-muted-foreground border-l-2 border-primary/30 pl-3">
                  "{quotes}"
                </blockquote>
              ) : (
                <p className="text-sm text-muted-foreground/60 italic">No quote added</p>
              )}
            </div>
          </DetailItem>

          {/* Recommended Books */}
          <DetailItem
            icon={<BookOpen className="h-4 w-4" />}
            label="Recommended Books"
          >
            <div className="pl-6 mt-1">
              {recommendedBooks && recommendedBooks.length > 0 ? (
                <ul className="space-y-1">
                  {recommendedBooks.slice(0, 4).map((book, idx) => (
                    <li key={idx} className="text-sm text-foreground flex items-start gap-2">
                      <span className="text-primary">•</span>
                      {book}
                    </li>
                  ))}
                  {recommendedBooks.length > 4 && (
                    <li className="text-xs text-muted-foreground">
                      +{recommendedBooks.length - 4} more books
                    </li>
                  )}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground/60 italic">No books recommended</p>
              )}
            </div>
          </DetailItem>
        </div>
      </div>
    </motion.div>
  );
};

export default PersonalDetailsCard;
