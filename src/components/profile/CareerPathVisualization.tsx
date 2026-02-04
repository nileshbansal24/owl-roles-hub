import * as React from "react";
import { motion } from "framer-motion";
import { 
  TrendingUp, 
  Building2, 
  GraduationCap, 
  Award, 
  ChevronRight,
  Info,
  CheckCircle2,
  Clock,
  IndianRupee,
  Users,
  Briefcase,
  Star
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface CareerPathVisualizationProps {
  currentRole?: string | null;
  yearsExperience?: number | null;
  className?: string;
}

// Academic teaching career path data based on Indian market standards
const academicCareerPath = [
  {
    id: "assistant-professor",
    title: "Assistant Professor",
    shortTitle: "Asst. Prof",
    salaryRange: "₹3L - ₹8L",
    avgSalary: 5.5,
    experience: "0-5 years",
    minYears: 0,
    maxYears: 5,
    description: "Entry-level teaching and research position",
    responsibilities: [
      "Conduct undergraduate/postgraduate lectures",
      "Guide student projects and dissertations",
      "Publish research papers in peer-reviewed journals",
      "Assist in departmental administrative tasks"
    ],
    keySkills: ["Teaching Methodology", "Research Skills", "Subject Expertise", "Communication"],
    growthFactors: [
      "Research publications (2-3 papers/year)",
      "Ph.D. completion if not done",
      "Industry collaborations",
      "Conference presentations"
    ]
  },
  {
    id: "associate-professor",
    title: "Associate Professor",
    shortTitle: "Assoc. Prof",
    salaryRange: "₹6L - ₹15L",
    avgSalary: 10,
    experience: "5-10 years",
    minYears: 5,
    maxYears: 10,
    description: "Mid-level faculty with research leadership",
    responsibilities: [
      "Lead research groups and projects",
      "Mentor junior faculty and Ph.D. scholars",
      "Develop curriculum and course materials",
      "Serve on academic committees"
    ],
    keySkills: ["Research Leadership", "Mentoring", "Curriculum Design", "Grant Writing"],
    growthFactors: [
      "5+ high-impact publications",
      "Successful research grants",
      "Ph.D. student supervision",
      "International collaborations"
    ]
  },
  {
    id: "professor",
    title: "Professor",
    shortTitle: "Professor",
    salaryRange: "₹10L - ₹25L",
    avgSalary: 17.5,
    experience: "10-15 years",
    minYears: 10,
    maxYears: 15,
    description: "Senior faculty with significant research impact",
    responsibilities: [
      "Lead major research initiatives",
      "Guide institutional academic policies",
      "Build industry-academia partnerships",
      "Represent institution at national/international forums"
    ],
    keySkills: ["Strategic Vision", "Thought Leadership", "Networking", "Policy Development"],
    growthFactors: [
      "15+ high-impact publications",
      "h-index above 10",
      "Major research grants",
      "National/international recognition"
    ]
  },
  {
    id: "hod",
    title: "Head of Department (HOD)",
    shortTitle: "HOD",
    salaryRange: "₹12L - ₹30L",
    avgSalary: 21,
    experience: "12-18 years",
    minYears: 12,
    maxYears: 18,
    description: "Department leadership with administrative duties",
    responsibilities: [
      "Manage department operations and budget",
      "Faculty recruitment and performance evaluation",
      "Curriculum development and accreditation",
      "Student welfare and grievance handling"
    ],
    keySkills: ["Department Management", "Budget Planning", "Team Leadership", "Accreditation"],
    growthFactors: [
      "Administrative experience",
      "Successful accreditations (NAAC, NBA)",
      "Department growth metrics",
      "Industry tie-ups"
    ]
  },
  {
    id: "assistant-director",
    title: "Assistant Director",
    shortTitle: "Asst. Director",
    salaryRange: "₹15L - ₹35L",
    avgSalary: 25,
    experience: "15-20 years",
    minYears: 15,
    maxYears: 20,
    description: "Institutional leadership supporting director",
    responsibilities: [
      "Support institutional strategic planning",
      "Oversee multiple departments",
      "Lead quality assurance initiatives",
      "External stakeholder management"
    ],
    keySkills: ["Strategic Planning", "Multi-department Oversight", "Quality Assurance", "Stakeholder Management"],
    growthFactors: [
      "Cross-functional experience",
      "Leadership in major initiatives",
      "Institutional rankings improvement",
      "Strong industry network"
    ]
  },
  {
    id: "director",
    title: "Director / Principal",
    shortTitle: "Director",
    salaryRange: "₹20L - ₹50L",
    avgSalary: 35,
    experience: "18-25 years",
    minYears: 18,
    maxYears: 25,
    description: "Top institutional leadership",
    responsibilities: [
      "Set institutional vision and strategy",
      "Board and regulatory compliance",
      "Resource mobilization and fundraising",
      "Brand building and institutional reputation"
    ],
    keySkills: ["Visionary Leadership", "Governance", "Fundraising", "Brand Management"],
    growthFactors: [
      "Track record of institutional growth",
      "Government/regulatory relationships",
      "Major grants and partnerships",
      "National recognition"
    ]
  },
  {
    id: "executive-director",
    title: "Executive Director / Vice Chancellor",
    shortTitle: "Exec. Director",
    salaryRange: "₹35L - ₹80L+",
    avgSalary: 55,
    experience: "25+ years",
    minYears: 25,
    maxYears: 40,
    description: "Apex leadership for large institutions",
    responsibilities: [
      "University/group-level strategic direction",
      "Major policy decisions",
      "Government and international relations",
      "Legacy building and succession planning"
    ],
    keySkills: ["Institutional Governance", "Policy Influence", "International Relations", "Legacy Building"],
    growthFactors: [
      "Multi-institution experience",
      "National/international awards",
      "Policy committee memberships",
      "Significant research/academic contribution"
    ]
  }
];

// Administrative/Non-Teaching career path for institutional support roles
const administrativeCareerPath = [
  {
    id: "executive",
    title: "Executive / Officer",
    shortTitle: "Executive",
    salaryRange: "₹2L - ₹4L",
    avgSalary: 3,
    experience: "0-3 years",
    minYears: 0,
    maxYears: 3,
    description: "Entry-level administrative support role",
    responsibilities: [
      "Handle day-to-day administrative tasks",
      "Maintain records and documentation",
      "Coordinate with various departments",
      "Support senior staff in operations"
    ],
    keySkills: ["MS Office", "Communication", "Record Keeping", "Coordination"],
    growthFactors: [
      "Process improvement initiatives",
      "Cross-functional exposure",
      "Additional certifications",
      "Strong performance reviews"
    ]
  },
  {
    id: "senior-executive",
    title: "Senior Executive",
    shortTitle: "Sr. Executive",
    salaryRange: "₹3L - ₹5L",
    avgSalary: 4,
    experience: "3-6 years",
    minYears: 3,
    maxYears: 6,
    description: "Experienced administrative professional",
    responsibilities: [
      "Handle complex administrative processes",
      "Train and guide junior staff",
      "Manage departmental documentation",
      "Liaise with external stakeholders"
    ],
    keySkills: ["Process Management", "Training", "Stakeholder Management", "Problem Solving"],
    growthFactors: [
      "Leadership of small projects",
      "ERP/software proficiency",
      "Domain specialization",
      "Team coordination skills"
    ]
  },
  {
    id: "assistant-manager",
    title: "Assistant Manager",
    shortTitle: "Asst. Manager",
    salaryRange: "₹4L - ₹6L",
    avgSalary: 5,
    experience: "5-8 years",
    minYears: 5,
    maxYears: 8,
    description: "First-level management position",
    responsibilities: [
      "Supervise team of executives",
      "Implement departmental policies",
      "Handle escalations and complex issues",
      "Prepare reports for management"
    ],
    keySkills: ["Team Supervision", "Policy Implementation", "Reporting", "Conflict Resolution"],
    growthFactors: [
      "MBA or equivalent qualification",
      "People management experience",
      "Budget handling exposure",
      "Cross-departmental projects"
    ]
  },
  {
    id: "manager",
    title: "Manager",
    shortTitle: "Manager",
    salaryRange: "₹4L - ₹8L",
    avgSalary: 6,
    experience: "8-12 years",
    minYears: 8,
    maxYears: 12,
    description: "Department/function management",
    responsibilities: [
      "Manage department operations",
      "Drive process improvements",
      "Handle departmental budgets",
      "Performance management of team"
    ],
    keySkills: ["Department Management", "Budget Planning", "Process Optimization", "Leadership"],
    growthFactors: [
      "Strategic initiative leadership",
      "Cost optimization achievements",
      "Team building and retention",
      "Digital transformation projects"
    ]
  },
  {
    id: "senior-manager",
    title: "Senior Manager / Deputy Director",
    shortTitle: "Sr. Manager",
    salaryRange: "₹6L - ₹12L",
    avgSalary: 9,
    experience: "12-18 years",
    minYears: 12,
    maxYears: 18,
    description: "Senior management with strategic responsibilities",
    responsibilities: [
      "Oversee multiple functions/teams",
      "Strategic planning and execution",
      "Policy development",
      "Key stakeholder relationship management"
    ],
    keySkills: ["Strategic Planning", "Multi-team Management", "Policy Development", "Stakeholder Relations"],
    growthFactors: [
      "Institution-wide impact projects",
      "External collaborations",
      "Regulatory compliance expertise",
      "Leadership development programs"
    ]
  },
  {
    id: "agm-dgm",
    title: "AGM / DGM",
    shortTitle: "AGM/DGM",
    salaryRange: "₹10L - ₹18L",
    avgSalary: 14,
    experience: "18-22 years",
    minYears: 18,
    maxYears: 22,
    description: "Executive leadership role",
    responsibilities: [
      "Lead major institutional functions",
      "Resource allocation and optimization",
      "Board-level reporting",
      "Strategic decision making"
    ],
    keySkills: ["Executive Leadership", "Resource Management", "Board Communication", "Strategic Vision"],
    growthFactors: [
      "Multi-department oversight",
      "Significant cost/efficiency gains",
      "Industry networking",
      "Thought leadership"
    ]
  },
  {
    id: "gm-director",
    title: "GM / Director (Admin)",
    shortTitle: "GM/Director",
    salaryRange: "₹15L - ₹30L+",
    avgSalary: 22.5,
    experience: "22+ years",
    minYears: 22,
    maxYears: 35,
    description: "Top administrative leadership",
    responsibilities: [
      "Overall institutional administration",
      "Policy and governance",
      "Organizational transformation",
      "Executive committee participation"
    ],
    keySkills: ["Institutional Governance", "Transformation Leadership", "Executive Management", "Vision Setting"],
    growthFactors: [
      "Institution-wide transformation",
      "Excellence awards and recognition",
      "Industry body participation",
      "Mentoring next-gen leaders"
    ]
  }
];

// Helper function to detect if role is teaching or non-teaching
const isTeachingRole = (role: string | null | undefined): boolean => {
  if (!role) return true; // Default to teaching path
  const roleLower = role.toLowerCase();
  
  // Non-teaching keywords
  const nonTeachingKeywords = [
    "hr", "human resource", "admin", "administrator", "administration",
    "finance", "accounts", "accountant", "purchase", "procurement",
    "registrar", "librarian", "library", "it ", "information technology",
    "maintenance", "security", "transport", "hostel", "warden",
    "placement", "training", "tpo", "counselor", "counsellor",
    "manager", "executive", "coordinator", "officer", "clerk",
    "receptionist", "secretary", "assistant" // generic admin roles
  ];
  
  // Teaching keywords take precedence
  const teachingKeywords = [
    "professor", "lecturer", "faculty", "teacher", "instructor",
    "dean", "hod", "head of department", "principal", "director",
    "academic", "research"
  ];
  
  // Check for teaching keywords first
  for (const keyword of teachingKeywords) {
    if (roleLower.includes(keyword)) return true;
  }
  
  // Check for non-teaching keywords
  for (const keyword of nonTeachingKeywords) {
    if (roleLower.includes(keyword)) return false;
  }
  
  return true; // Default to teaching
};

// Market insights data
const marketInsights = {
  salaryFactors: [
    {
      factor: "Institution Type",
      description: "IITs/IIMs/NITs pay 20-40% premium over private colleges",
      icon: Building2
    },
    {
      factor: "Location",
      description: "Metro cities (Delhi, Mumbai, Bangalore) command 15-25% higher salaries",
      icon: Building2
    },
    {
      factor: "Research Output",
      description: "High h-index and citation count can increase salary by 10-20%",
      icon: Award
    },
    {
      factor: "Industry Experience",
      description: "Prior industry experience adds 10-15% to academic salaries",
      icon: Briefcase
    },
    {
      factor: "Administrative Roles",
      description: "Additional allowances for HOD, Dean, Director positions",
      icon: Users
    }
  ],
  calculationMethodology: [
    "Base salary determined by UGC/AICTE pay scales for government institutions",
    "Private institutions follow 6th/7th Pay Commission guidelines with variations",
    "Performance bonuses based on research publications and student feedback",
    "Additional allowances: DA, HRA, Academic Allowance, Research Allowance",
    "Increment based on years of service and performance reviews"
  ],
  payCommission: {
    title: "7th Pay Commission Structure",
    levels: [
      { level: "Level 10", role: "Assistant Professor (Entry)", basic: "₹57,700" },
      { level: "Level 11", role: "Assistant Professor (Senior)", basic: "₹68,900" },
      { level: "Level 12", role: "Associate Professor", basic: "₹79,800" },
      { level: "Level 13A", role: "Professor (Entry)", basic: "₹1,31,400" },
      { level: "Level 14", role: "Professor (Senior)", basic: "₹1,44,200" },
      { level: "Level 14A", role: "Professor (HAG)", basic: "₹1,59,100" }
    ]
  }
};

export const CareerPathVisualization = ({
  currentRole,
  yearsExperience,
  className
}: CareerPathVisualizationProps) => {
  const [selectedLevel, setSelectedLevel] = React.useState<string | null>(null);
  
  // Determine default path based on role, but allow manual override
  const defaultIsTeaching = isTeachingRole(currentRole);
  const [viewingTeachingPath, setViewingTeachingPath] = React.useState(defaultIsTeaching);
  
  // Use the manually selected path
  const careerPath = viewingTeachingPath ? academicCareerPath : administrativeCareerPath;
  
  // Reset selected level when switching paths
  React.useEffect(() => {
    setSelectedLevel(null);
  }, [viewingTeachingPath]);
  
  // Determine current position in career path (only relevant if viewing their actual path)
  const getCurrentLevelIndex = () => {
    // If viewing a different path than their role, start at beginning
    if (viewingTeachingPath !== defaultIsTeaching) return 0;
    
    const role = (currentRole || "").toLowerCase();
    
    if (viewingTeachingPath) {
      // Teaching career path logic
      if (role.includes("executive") || role.includes("vice chancellor")) return 6;
      if (role.includes("director") || role.includes("principal")) return 5;
      if (role.includes("assistant director")) return 4;
      if (role.includes("hod") || role.includes("head") || role.includes("dean")) return 3;
      if (role.includes("professor") && !role.includes("assistant") && !role.includes("associate")) return 2;
      if (role.includes("associate")) return 1;
      return 0;
    } else {
      // Administrative career path logic
      if (role.includes("gm") || role.includes("general manager") || (role.includes("director") && !role.includes("assistant"))) return 6;
      if (role.includes("agm") || role.includes("dgm") || role.includes("deputy")) return 5;
      if (role.includes("senior manager") || role.includes("sr. manager") || role.includes("sr manager")) return 4;
      if (role.includes("manager") && !role.includes("assistant") && !role.includes("senior") && !role.includes("sr")) return 3;
      if (role.includes("assistant manager") || role.includes("asst. manager") || role.includes("asst manager")) return 2;
      if (role.includes("senior executive") || role.includes("sr. executive") || role.includes("sr executive")) return 1;
      return 0;
    }
  };

  const currentLevelIndex = getCurrentLevelIndex();
  const selectedLevelData = selectedLevel 
    ? careerPath.find(l => l.id === selectedLevel)
    : careerPath[currentLevelIndex];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-heading font-bold text-foreground">Career Path & Salary Insights</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Based on Indian {viewingTeachingPath ? "academic" : "institutional"} market data and HR best practices
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Path Toggle */}
          <div className="flex items-center gap-2 p-1 rounded-lg bg-muted/50 border border-border">
            <button
              onClick={() => setViewingTeachingPath(true)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                viewingTeachingPath 
                  ? "bg-background text-foreground shadow-sm" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <GraduationCap className="h-3.5 w-3.5" />
              Teaching
            </button>
            <button
              onClick={() => setViewingTeachingPath(false)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                !viewingTeachingPath 
                  ? "bg-background text-foreground shadow-sm" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Briefcase className="h-3.5 w-3.5" />
              Non-Teaching
            </button>
          </div>
          <Badge className="bg-primary/10 text-primary border-0 hidden sm:flex">
            <TrendingUp className="h-3 w-3 mr-1" />
            2024-25 Data
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="career-path" className="space-y-6">
        <TabsList className="bg-muted/50 p-1">
          <TabsTrigger value="career-path" className="data-[state=active]:bg-background">
            <GraduationCap className="h-4 w-4 mr-2" />
            Career Path
          </TabsTrigger>
          <TabsTrigger value="salary-factors" className="data-[state=active]:bg-background">
            <IndianRupee className="h-4 w-4 mr-2" />
            Salary Factors
          </TabsTrigger>
          <TabsTrigger value="methodology" className="data-[state=active]:bg-background">
            <Info className="h-4 w-4 mr-2" />
            How It's Calculated
          </TabsTrigger>
        </TabsList>

        {/* Career Path Tab */}
        <TabsContent value="career-path" className="space-y-6">
          {/* Career Ladder Visualization */}
          <Card className="overflow-hidden">
            <CardHeader className="pb-4">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                {viewingTeachingPath ? "Academic Career Progression" : "Administrative Career Progression"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Horizontal Timeline */}
              <div className="relative">
                {/* Progress Line */}
                <div className="absolute top-6 left-0 right-0 h-1 bg-muted rounded-full">
                  <motion.div 
                    className="h-full bg-gradient-to-r from-primary to-primary/60 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${((currentLevelIndex + 1) / careerPath.length) * 100}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                  />
                </div>

                {/* Level Nodes */}
                <div className="flex justify-between relative">
                  {careerPath.map((level, index) => {
                    const isCompleted = index < currentLevelIndex;
                    const isCurrent = index === currentLevelIndex;
                    const isSelected = selectedLevel === level.id;
                    
                    return (
                      <Tooltip key={level.id}>
                        <TooltipTrigger asChild>
                          <motion.button
                            onClick={() => setSelectedLevel(level.id)}
                            className={cn(
                              "flex flex-col items-center z-10 transition-all",
                              "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-lg p-2 -mx-2"
                            )}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <div
                              className={cn(
                                "w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all",
                                isCompleted && "bg-primary border-primary text-primary-foreground",
                                isCurrent && "bg-primary/20 border-primary text-primary ring-4 ring-primary/20",
                                !isCompleted && !isCurrent && "bg-muted border-border text-muted-foreground",
                                isSelected && "ring-4 ring-primary/30"
                              )}
                            >
                              {isCompleted ? (
                                <CheckCircle2 className="h-5 w-5" />
                              ) : (
                                <span className="text-xs font-bold">{index + 1}</span>
                              )}
                            </div>
                            <span className={cn(
                              "text-[10px] mt-2 max-w-[60px] text-center leading-tight",
                              (isCurrent || isSelected) ? "text-foreground font-medium" : "text-muted-foreground"
                            )}>
                              {level.shortTitle}
                            </span>
                          </motion.button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="max-w-xs">
                          <div className="space-y-1">
                            <p className="font-semibold">{level.title}</p>
                            <p className="text-xs text-muted-foreground">{level.experience}</p>
                            <p className="text-sm text-primary font-medium">{level.salaryRange}</p>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    );
                  })}
                </div>
              </div>

              {/* Selected Level Details */}
              {selectedLevelData && (
                <motion.div
                  key={selectedLevelData.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-8 p-5 rounded-xl bg-gradient-to-br from-primary/5 to-transparent border border-primary/10"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">{selectedLevelData.title}</h3>
                      <p className="text-sm text-muted-foreground">{selectedLevelData.description}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-primary">{selectedLevelData.salaryRange}</p>
                      <p className="text-xs text-muted-foreground">per annum</p>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4 mt-4">
                    {/* Responsibilities */}
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
                        <Briefcase className="h-4 w-4 text-primary" />
                        Key Responsibilities
                      </h4>
                      <ul className="space-y-1.5">
                        {selectedLevelData.responsibilities.map((resp, i) => (
                          <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                            <ChevronRight className="h-3 w-3 mt-0.5 text-primary shrink-0" />
                            {resp}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Growth Factors */}
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
                        <Star className="h-4 w-4 text-primary" />
                        Growth Factors
                      </h4>
                      <ul className="space-y-1.5">
                        {selectedLevelData.growthFactors.map((factor, i) => (
                          <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                            <ChevronRight className="h-3 w-3 mt-0.5 text-primary shrink-0" />
                            {factor}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Key Skills */}
                  <div className="mt-4 pt-4 border-t border-border/50">
                    <h4 className="text-sm font-medium text-foreground mb-2">Required Skills</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedLevelData.keySkills.map((skill, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Experience Range */}
                  <div className="mt-4 pt-4 border-t border-border/50">
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        Typical Experience
                      </span>
                      <span className="font-medium">{selectedLevelData.experience}</span>
                    </div>
                    <Progress 
                      value={((selectedLevelData.maxYears - selectedLevelData.minYears) / 25) * 100} 
                      className="h-2"
                    />
                  </div>
                </motion.div>
              )}
            </CardContent>
          </Card>

          {/* Salary Comparison Chart */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base flex items-center gap-2">
                <IndianRupee className="h-4 w-4 text-primary" />
                Salary Progression Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <motion.div 
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="space-y-3"
              >
                {careerPath.map((level, index) => {
                  const widthPercent = (level.avgSalary / (viewingTeachingPath ? 55 : 37.5)) * 100;
                  const isCurrent = index === currentLevelIndex;
                  
                  return (
                    <motion.div key={level.id} variants={itemVariants} className="group">
                      <div className="flex items-center gap-3">
                        <div className="w-28 text-xs text-muted-foreground shrink-0">
                          {level.shortTitle}
                        </div>
                        <div className="flex-1 relative">
                          <div className="h-8 bg-muted rounded-lg overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${widthPercent}%` }}
                              transition={{ duration: 0.8, delay: index * 0.1 }}
                              className={cn(
                                "h-full rounded-lg flex items-center justify-end pr-3 transition-all",
                                isCurrent 
                                  ? "bg-gradient-to-r from-primary to-primary/80" 
                                  : "bg-gradient-to-r from-secondary to-secondary/80 group-hover:from-primary/60 group-hover:to-primary/40"
                              )}
                            >
                              <span className={cn(
                                "text-xs font-medium",
                                isCurrent ? "text-primary-foreground" : "text-foreground"
                              )}>
                                {level.salaryRange}
                              </span>
                            </motion.div>
                          </div>
                          {isCurrent && (
                            <Badge className="absolute -top-2 right-0 text-[10px] bg-primary">
                              You're here
                            </Badge>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Salary Factors Tab */}
        <TabsContent value="salary-factors" className="space-y-6">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                Factors Affecting Your Salary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <motion.div 
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="grid gap-4"
              >
                {marketInsights.salaryFactors.map((factor, index) => (
                  <motion.div
                    key={factor.factor}
                    variants={itemVariants}
                    className="flex items-start gap-4 p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <factor.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-medium text-foreground">{factor.factor}</h4>
                      <p className="text-sm text-muted-foreground mt-0.5">{factor.description}</p>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </CardContent>
          </Card>

          {/* Pay Commission Reference */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base flex items-center gap-2">
                <Building2 className="h-4 w-4 text-primary" />
                {marketInsights.payCommission.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Government and UGC-affiliated institutions follow this structure:
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 px-3 font-medium text-muted-foreground">Level</th>
                      <th className="text-left py-2 px-3 font-medium text-muted-foreground">Role</th>
                      <th className="text-right py-2 px-3 font-medium text-muted-foreground">Basic Pay</th>
                    </tr>
                  </thead>
                  <tbody>
                    {marketInsights.payCommission.levels.map((level, index) => (
                      <tr key={level.level} className="border-b border-border/50 hover:bg-muted/30">
                        <td className="py-2.5 px-3 font-medium">{level.level}</td>
                        <td className="py-2.5 px-3 text-muted-foreground">{level.role}</td>
                        <td className="py-2.5 px-3 text-right text-primary font-medium">{level.basic}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-muted-foreground mt-4">
                * Total salary includes DA, HRA, and other allowances (typically 80-100% of basic pay)
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Methodology Tab */}
        <TabsContent value="methodology" className="space-y-6">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base flex items-center gap-2">
                <Info className="h-4 w-4 text-primary" />
                How Salaries Are Calculated
              </CardTitle>
            </CardHeader>
            <CardContent>
              <motion.div 
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="space-y-4"
              >
                {marketInsights.calculationMethodology.map((point, index) => (
                  <motion.div
                    key={index}
                    variants={itemVariants}
                    className="flex items-start gap-3"
                  >
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-primary">{index + 1}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{point}</p>
                  </motion.div>
                ))}
              </motion.div>
            </CardContent>
          </Card>

          {/* Data Sources */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base flex items-center gap-2">
                <Award className="h-4 w-4 text-primary" />
                Data Sources & References
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3">
                {[
                  "UGC (University Grants Commission) Pay Scales",
                  "AICTE (All India Council for Technical Education) Guidelines",
                  "7th Central Pay Commission Recommendations",
                  "Industry salary surveys from Naukri, LinkedIn, Glassdoor",
                  "Academic institution annual reports",
                  "HR best practices from leading Indian universities"
                ].map((source, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                    {source}
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-4 p-3 rounded-lg bg-muted/30">
                💡 <strong>Note:</strong> Salary estimates are based on market data and may vary by institution, location, and individual qualifications. For the most accurate information, consult specific institution pay scales.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CareerPathVisualization;
