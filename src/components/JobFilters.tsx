import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

const designations = [
  { id: "assistant-professor", label: "Assistant Professor" },
  { id: "associate-professor", label: "Associate Professor" },
  { id: "professor", label: "Professor" },
  { id: "dean", label: "Dean" },
  { id: "vice-chancellor", label: "Vice Chancellor" },
  { id: "researcher", label: "Researcher" },
  { id: "postdoc", label: "Postdoctoral Fellow" },
];

const jobTypes = [
  { id: "full-time", label: "Full Time" },
  { id: "part-time", label: "Part Time" },
  { id: "contract", label: "Contract" },
  { id: "visiting", label: "Visiting" },
];

interface JobFiltersProps {
  selectedDesignations: string[];
  setSelectedDesignations: (designations: string[]) => void;
  selectedJobTypes: string[];
  setSelectedJobTypes: (types: string[]) => void;
}

const JobFilters = ({
  selectedDesignations,
  setSelectedDesignations,
  selectedJobTypes,
  setSelectedJobTypes,
}: JobFiltersProps) => {
  const toggleDesignation = (designation: string) => {
    if (selectedDesignations.includes(designation)) {
      setSelectedDesignations(selectedDesignations.filter((d) => d !== designation));
    } else {
      setSelectedDesignations([...selectedDesignations, designation]);
    }
  };

  const toggleJobType = (type: string) => {
    if (selectedJobTypes.includes(type)) {
      setSelectedJobTypes(selectedJobTypes.filter((t) => t !== type));
    } else {
      setSelectedJobTypes([...selectedJobTypes, type]);
    }
  };

  return (
    <aside className="w-full lg:w-64 shrink-0">
      <div className="card-elevated p-5 sticky top-24">
        <h3 className="font-heading font-semibold text-foreground mb-4">Filters</h3>

        {/* Designation Filter */}
        <div className="mb-6">
          <h4 className="text-sm font-medium text-foreground mb-3">Designation</h4>
          <div className="space-y-3">
            {designations.map((designation) => (
              <div key={designation.id} className="flex items-center space-x-2">
                <Checkbox
                  id={designation.id}
                  checked={selectedDesignations.includes(designation.label)}
                  onCheckedChange={() => toggleDesignation(designation.label)}
                />
                <Label
                  htmlFor={designation.id}
                  className="text-sm text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
                >
                  {designation.label}
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* Job Type Filter */}
        <div>
          <h4 className="text-sm font-medium text-foreground mb-3">Job Type</h4>
          <div className="space-y-3">
            {jobTypes.map((type) => (
              <div key={type.id} className="flex items-center space-x-2">
                <Checkbox
                  id={type.id}
                  checked={selectedJobTypes.includes(type.label)}
                  onCheckedChange={() => toggleJobType(type.label)}
                />
                <Label
                  htmlFor={type.id}
                  className="text-sm text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
                >
                  {type.label}
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* Clear Filters */}
        {(selectedDesignations.length > 0 || selectedJobTypes.length > 0) && (
          <button
            onClick={() => {
              setSelectedDesignations([]);
              setSelectedJobTypes([]);
            }}
            className="mt-6 text-sm text-primary hover:underline"
          >
            Clear all filters
          </button>
        )}
      </div>
    </aside>
  );
};

export default JobFilters;