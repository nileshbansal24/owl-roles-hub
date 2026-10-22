import JobDetailModal from "@/components/JobDetailModal";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const job = {
  id: "test",
  title: "X (Twitter) – Growth, Content & Social Media Management",
  institute: "NB Hiring Consultants",
  location: "Phagwara",
  salary_range: "12 - 18 LPA",
  job_type: "Full Time",
  tags: ["Social Media Growth & Audience Acquisition", "X/Twitter Analytics & Performance Tracking", "Data Analysis & Reporting", "Content Strategy & Engagement Optimization"],
  created_at: new Date(Date.now() - 7 * 60 * 1000).toISOString(),
  description:
    "## About the Role Drive the growth and visibility of LPU's X presence through data-driven strategies. ## Responsibilities - Grow followers, engagement, impressions & reach - Track and analyze key X/Twitter metrics and performance - Develop strategies to improve audience acquisition and engagement - Identify trends, opportunities and high-performing content - Prepare actionable insights and growth reports ## Qualifications - Bachelors in relevant fields ## Job Details - Department: Public Relations & Communications - Role: X Growth Expert — Metrics - Experience: 8+ Years (8–25 yrs) - Vacancies: 1 ## About the Institute / Company - Location: Chandigarh",
  recruiter: null,
};

const DescTest = () => {
  const [open, setOpen] = useState(true);
  return (
    <div className="min-h-screen bg-background p-10">
      <Button onClick={() => setOpen(true)}>Open modal</Button>
      <JobDetailModal job={job} open={open} onOpenChange={setOpen} />
    </div>
  );
};

export default DescTest;
