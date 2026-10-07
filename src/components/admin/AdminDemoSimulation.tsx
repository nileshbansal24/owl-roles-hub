import { useCallback, useEffect, useState } from "react";
import { Activity, BriefcaseBusiness, Check, Loader2, RefreshCw, Users, WandSparkles } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";

type DemoCandidate = { name: string; title: string; skills: string[]; years: number; location: string; createdAt: string };
type DemoJob = { title: string; company: string; recruiter: string; location: string; type: string; salary: string; skills: string[]; createdAt: string };
type DemoActivity = { text: string; at: string };
type Simulation = { enabled: boolean; candidates: DemoCandidate[]; jobs: DemoJob[]; activity: DemoActivity[] };

const empty: Simulation = { enabled: false, candidates: [], jobs: [], activity: [] };
const candidateSeeds: Omit<DemoCandidate, "createdAt">[] = [
  { name: "Aarav Sharma", title: "Frontend Developer", skills: ["React", "TypeScript", "CSS"], years: 3, location: "Pune" },
  { name: "Meera Iyer", title: "Data Analyst", skills: ["SQL", "Python", "Power BI"], years: 4, location: "Bengaluru" },
  { name: "Kabir Mehta", title: "Product Manager", skills: ["Roadmapping", "Analytics", "Agile"], years: 7, location: "Mumbai" },
  { name: "Sana Khan", title: "UI/UX Designer", skills: ["Figma", "Prototyping", "Research"], years: 5, location: "Hyderabad" },
  { name: "Rohan Nair", title: "Backend Developer", skills: ["Node.js", "PostgreSQL", "AWS"], years: 6, location: "Kochi" },
  { name: "Ananya Das", title: "HR Specialist", skills: ["Recruiting", "HRIS", "Onboarding"], years: 4, location: "Kolkata" },
  { name: "Ishaan Verma", title: "Full Stack Developer", skills: ["React", "Node.js", "MongoDB"], years: 2, location: "Jaipur" },
  { name: "Priya Menon", title: "Digital Marketing Specialist", skills: ["SEO", "Content", "Analytics"], years: 5, location: "Chennai" },
  { name: "Dev Patel", title: "Data Scientist", skills: ["Python", "ML", "TensorFlow"], years: 6, location: "Ahmedabad" },
  { name: "Tara Kapoor", title: "Business Analyst", skills: ["Requirements", "SQL", "Tableau"], years: 3, location: "Delhi" },
  { name: "Arjun Rao", title: "Software Developer", skills: ["Java", "Spring", "Docker"], years: 8, location: "Bengaluru" },
  { name: "Nisha Thomas", title: "Project Manager", skills: ["Delivery", "Jira", "Stakeholders"], years: 9, location: "Thiruvananthapuram" },
  { name: "Vivaan Joshi", title: "Sales Executive", skills: ["CRM", "Negotiation", "B2B Sales"], years: 2, location: "Indore" },
  { name: "Simran Gill", title: "Customer Support Specialist", skills: ["Customer Success", "Zendesk", "Communication"], years: 3, location: "Amritsar" },
  { name: "Aditya Kulkarni", title: "Accountant", skills: ["GST", "Tally", "Reporting"], years: 7, location: "Nagpur" },
  { name: "Zoya Siddiqui", title: "Frontend Developer", skills: ["Vue", "JavaScript", "Accessibility"], years: 1, location: "Lucknow" },
  { name: "Neel Banerjee", title: "Backend Developer", skills: ["Go", "Redis", "Microservices"], years: 5, location: "Kolkata" },
  { name: "Ira Chawla", title: "UI/UX Designer", skills: ["Design Systems", "Figma", "Usability"], years: 2, location: "Gurugram" },
  { name: "Reyansh Shah", title: "Data Analyst", skills: ["Excel", "SQL", "Looker"], years: 1, location: "Surat" },
  { name: "Diya Reddy", title: "Product Manager", skills: ["Product Strategy", "Research", "Agile"], years: 8, location: "Visakhapatnam" },
  { name: "Atharv Sinha", title: "Full Stack Developer", skills: ["Next.js", "Python", "PostgreSQL"], years: 4, location: "Patna" },
  { name: "Pooja Bhat", title: "HR Specialist", skills: ["Talent Acquisition", "Payroll", "HRIS"], years: 6, location: "Mysuru" },
  { name: "Karan Malhotra", title: "Digital Marketing Specialist", skills: ["Paid Media", "SEO", "HubSpot"], years: 7, location: "Noida" },
  { name: "Aisha Fernandes", title: "Business Analyst", skills: ["Business Intelligence", "SQL", "Process Mapping"], years: 5, location: "Panaji" },
  { name: "Om Prakash", title: "Software Developer", skills: ["C#", ".NET", "Azure"], years: 3, location: "Bhopal" },
  { name: "Ritika Bose", title: "Data Scientist", skills: ["NLP", "Python", "Statistics"], years: 9, location: "Bengaluru" },
  { name: "Manav Desai", title: "Sales Executive", skills: ["Account Management", "CRM", "SaaS"], years: 4, location: "Vadodara" },
  { name: "Kavya Krishnan", title: "Project Manager", skills: ["Scrum", "Planning", "Jira"], years: 6, location: "Coimbatore" },
  { name: "Yash Agrawal", title: "Customer Support Specialist", skills: ["Technical Support", "SaaS", "Documentation"], years: 1, location: "Kanpur" },
  { name: "Saira Qureshi", title: "Accountant", skills: ["Auditing", "Excel", "Financial Reporting"], years: 5, location: "Mumbai" },
  { name: "Dhruv Anand", title: "Frontend Developer", skills: ["Angular", "TypeScript", "Testing"], years: 7, location: "Chennai" },
  { name: "Leela Pillai", title: "Backend Developer", skills: ["Python", "FastAPI", "PostgreSQL"], years: 2, location: "Kochi" },
  { name: "Siddharth Roy", title: "Product Manager", skills: ["B2B SaaS", "Metrics", "Discovery"], years: 4, location: "Delhi" },
  { name: "Maya George", title: "UI/UX Designer", skills: ["Interaction Design", "Figma", "Accessibility"], years: 8, location: "Bengaluru" },
  { name: "Parth Trivedi", title: "Data Analyst", skills: ["Python", "SQL", "Data Studio"], years: 2, location: "Rajkot" },
  { name: "Noor Fatima", title: "HR Specialist", skills: ["People Operations", "Hiring", "Employee Relations"], years: 3, location: "Hyderabad" },
];

const jobSeeds: Omit<DemoJob, "recruiter" | "createdAt">[] = [
  { title: "Senior Frontend Engineer", company: "Northstar Digital", location: "Bengaluru", type: "Full-time", salary: "18–24 LPA", skills: ["React", "TypeScript"] },
  { title: "Data Analyst", company: "Meridian Insights", location: "Mumbai", type: "Full-time", salary: "10–14 LPA", skills: ["SQL", "Power BI"] },
  { title: "Product Manager", company: "Fieldnote Labs", location: "Pune", type: "Full-time", salary: "20–28 LPA", skills: ["Product Strategy", "Agile"] },
  { title: "UX Designer", company: "Clearpath Studio", location: "Remote", type: "Full-time", salary: "12–17 LPA", skills: ["Figma", "Prototyping"] },
  { title: "Backend Developer", company: "Cloudline Systems", location: "Hyderabad", type: "Full-time", salary: "16–22 LPA", skills: ["Node.js", "PostgreSQL"] },
  { title: "Talent Acquisition Partner", company: "Harbor & Co.", location: "Delhi", type: "Full-time", salary: "9–13 LPA", skills: ["Recruiting", "HRIS"] },
  { title: "Digital Marketing Executive", company: "Brightwell Media", location: "Jaipur", type: "Full-time", salary: "7–11 LPA", skills: ["SEO", "Content"] },
  { title: "Business Analyst", company: "Pioneer Consulting", location: "Chennai", type: "Full-time", salary: "11–16 LPA", skills: ["SQL", "Requirements"] },
  { title: "Full Stack Developer", company: "Juniper Works", location: "Remote", type: "Full-time", salary: "14–20 LPA", skills: ["React", "Node.js"] },
  { title: "Customer Success Associate", company: "Evergreen Software", location: "Kolkata", type: "Full-time", salary: "6–9 LPA", skills: ["Customer Success", "Communication"] },
  { title: "Project Manager", company: "Summit Services", location: "Ahmedabad", type: "Full-time", salary: "15–21 LPA", skills: ["Delivery", "Jira"] },
  { title: "Financial Accountant", company: "Cedar Finance", location: "Noida", type: "Full-time", salary: "8–12 LPA", skills: ["Accounting", "GST"] },
];

const timeLabel = (iso: string) => {
  const elapsed = Math.max(0, Date.now() - new Date(iso).getTime());
  const hours = Math.floor(elapsed / 3_600_000);
  if (hours < 1) return "Just now";
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
};

const AdminDemoSimulation = () => {
  const [simulation, setSimulation] = useState<Simulation>(empty);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const loadSimulation = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from("demo_simulation_state").select("*").eq("id", "owlroles").maybeSingle();
    if (error) toast.error("Could not load demo simulation");
    else if (data) setSimulation({
      enabled: data.enabled,
      candidates: Array.isArray(data.candidates) ? data.candidates as unknown as DemoCandidate[] : [],
      jobs: Array.isArray(data.jobs) ? data.jobs as unknown as DemoJob[] : [],
      activity: Array.isArray(data.activity) ? data.activity as unknown as DemoActivity[] : [],
    });
    setLoading(false);
  }, []);

  useEffect(() => { void loadSimulation(); }, [loadSimulation]);

  const save = async (next: Simulation) => {
    setBusy(true);
    const { error } = await supabase.from("demo_simulation_state").upsert({
      id: "owlroles",
      enabled: next.enabled,
      candidates: next.candidates as unknown as Json,
      jobs: next.jobs as unknown as Json,
      activity: next.activity as unknown as Json,
      updated_at: new Date().toISOString(),
    });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    setSimulation(next);
    toast.success("Demo simulation updated");
  };

  const generateCandidates = () => {
    const now = Date.now();
    const candidates = candidateSeeds.map((candidate, index) => ({ ...candidate, createdAt: new Date(now - (index * 37 + (index % 4) * 19) * 3_600_000).toISOString() }));
    void save({ ...simulation, candidates });
  };

  const generateJobs = async () => {
    setBusy(true);
    const { data, error } = await supabase.from("profiles").select("full_name").eq("user_type", "recruiter").order("created_at", { ascending: true }).limit(2);
    if (error) { setBusy(false); toast.error("Could not load the existing recruiters"); return; }
    if (!data?.length) { setBusy(false); toast.error("No existing recruiter profiles are available"); return; }
    const names = data.map((profile, index) => profile.full_name || `Recruiter ${index + 1}`);
    const now = Date.now();
    const jobs = jobSeeds.map((job, index) => ({ ...job, recruiter: names[index % names.length], createdAt: new Date(now - (index * 29 + (index % 3) * 13) * 3_600_000).toISOString() }));
    setBusy(false);
    void save({ ...simulation, jobs });
  };

  const generateActivity = () => {
    const names = simulation.candidates.length ? simulation.candidates.map((candidate) => candidate.name) : candidateSeeds.map((candidate) => candidate.name);
    const jobNames = simulation.jobs.length ? simulation.jobs.map((job) => job.title) : jobSeeds.map((job) => job.title);
    const events: DemoActivity[] = [];
    for (let index = 0; index < 48; index += 1) {
      const candidate = names[(index * 7) % names.length];
      const job = jobNames[(index * 5) % jobNames.length];
      const templates = [
        `${candidate} joined the talent community`,
        `${candidate} completed their professional profile`,
        `${candidate} viewed ${job}`,
        `${candidate} saved ${job}`,
        `${candidate} applied for ${job}`,
        `${job} received a recruiter review`,
        `${candidate} was matched with ${job}`,
      ];
      events.push({ text: templates[(index * 3) % templates.length], at: new Date(Date.now() - (index * 53 + (index % 5) * 17) * 60_000).toISOString() });
    }
    void save({ ...simulation, activity: events });
  };

  const enableSimulation = (enabled: boolean) => { void save({ ...simulation, enabled }); };
  const clearDemo = () => { void save({ ...empty, enabled: simulation.enabled }); };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2"><h1 className="text-3xl font-heading font-bold">Demo Simulation</h1><Badge variant="outline">Isolated data</Badge></div>
          <p className="mt-1 text-muted-foreground">Create a sample marketplace view without adding accounts or activity to live listings.</p>
        </div>
        <Button variant="outline" onClick={() => void loadSimulation()} disabled={loading || busy} aria-label="Refresh simulation data"><RefreshCw className="mr-2 h-4 w-4" />Refresh</Button>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0">
          <div><CardTitle className="flex items-center gap-2"><WandSparkles className="h-5 w-5" />Simulation mode</CardTitle><CardDescription className="mt-1">Generated activity is only visible in this admin section.</CardDescription></div>
          <Switch checked={simulation.enabled} onCheckedChange={enableSimulation} disabled={loading || busy} aria-label="Enable simulation mode" />
        </CardHeader>
      </Card>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Demo candidates", count: simulation.candidates.length, icon: Users },
          { label: "Demo job postings", count: simulation.jobs.length, icon: BriefcaseBusiness },
          { label: "Demo activity", count: simulation.activity.length, icon: Activity },
        ].map(({ label, count, icon: Icon }) => <Card key={label}><CardContent className="flex items-center gap-4 p-5"><div className="rounded-md bg-muted p-3"><Icon className="h-5 w-5 text-primary" /></div><div><p className="text-sm text-muted-foreground">{label}</p><p className="text-2xl font-semibold">{loading ? "—" : count}</p></div></CardContent></Card>)}
      </div>

      <Card>
        <CardHeader><CardTitle>Generate sample data</CardTitle><CardDescription>Uses clearly marked records stored separately from live candidate accounts, jobs and applications.</CardDescription></CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button onClick={generateCandidates} disabled={loading || busy}><Users className="mr-2 h-4 w-4" />Generate 36 candidates</Button>
          <Button onClick={() => void generateJobs()} disabled={loading || busy}><BriefcaseBusiness className="mr-2 h-4 w-4" />Generate 12 jobs</Button>
          <Button variant="secondary" onClick={generateActivity} disabled={loading || busy}><Activity className="mr-2 h-4 w-4" />Generate activity</Button>
          <Button variant="outline" onClick={clearDemo} disabled={loading || busy}><Check className="mr-2 h-4 w-4" />Clear demo data</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Recent simulated activity</CardTitle><CardDescription>Sample events only; no email, application, or recruiter notification is sent.</CardDescription></CardHeader>
        <CardContent>
          {loading ? <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Loading simulation…</div> : simulation.activity.length ? <ol className="divide-y divide-border">{simulation.activity.slice().sort((a, b) => b.at.localeCompare(a.at)).slice(0, 12).map((event, index) => <li key={`${event.at}-${index}`} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm"><span>{event.text}</span><time className="shrink-0 text-muted-foreground" dateTime={event.at}>{timeLabel(event.at)}</time></li>)}</ol> : <p className="py-6 text-sm text-muted-foreground">No demo activity yet.</p>}
        </CardContent>
      </Card>
      {busy && <p className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Saving simulation data…</p>}
    </div>
  );
};

export default AdminDemoSimulation;