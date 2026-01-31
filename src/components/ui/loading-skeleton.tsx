import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

// Card skeleton for candidate/application cards
export const CardSkeleton = ({ className }: { className?: string }) => (
  <div className={cn("card-elevated p-5 space-y-4", className)}>
    <div className="flex items-start gap-4">
      <Skeleton className="h-12 w-12 rounded-full shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-5 w-1/3" />
        <Skeleton className="h-4 w-1/2" />
        <div className="flex gap-2 pt-2">
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-6 w-14 rounded-full" />
        </div>
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-9 w-9 rounded-md" />
        <Skeleton className="h-9 w-16 rounded-md" />
      </div>
    </div>
  </div>
);

// Stats card skeleton
export const StatsCardSkeleton = ({ className }: { className?: string }) => (
  <div className={cn("card-elevated p-6", className)}>
    <div className="flex items-center justify-between">
      <div className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-12" />
      </div>
      <Skeleton className="h-12 w-12 rounded-lg" />
    </div>
  </div>
);

// Job card skeleton
export const JobCardSkeleton = ({ className }: { className?: string }) => (
  <div className={cn("card-elevated p-6", className)}>
    <div className="flex items-start justify-between gap-4">
      <div className="flex-1 space-y-3">
        <Skeleton className="h-6 w-2/3" />
        <Skeleton className="h-4 w-1/2" />
        <div className="flex gap-4 pt-1">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-28" />
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="text-center space-y-1">
          <Skeleton className="h-8 w-8 mx-auto" />
          <Skeleton className="h-3 w-16" />
        </div>
        <Skeleton className="h-9 w-24 rounded-md" />
      </div>
    </div>
  </div>
);

// Interview card skeleton
export const InterviewCardSkeleton = ({ className }: { className?: string }) => (
  <div className={cn("card-elevated p-5", className)}>
    <div className="flex items-start gap-4">
      <Skeleton className="h-10 w-10 rounded-full shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-5 w-1/2" />
        <Skeleton className="h-4 w-2/3" />
        <div className="flex gap-3 pt-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-20" />
        </div>
      </div>
      <Skeleton className="h-6 w-20 rounded-full" />
    </div>
  </div>
);

// Search/filter bar skeleton
export const FilterBarSkeleton = ({ className }: { className?: string }) => (
  <div className={cn("flex flex-wrap items-center gap-4", className)}>
    <Skeleton className="h-11 w-64" />
    <Skeleton className="h-11 w-40" />
    <Skeleton className="h-11 w-48" />
    <Skeleton className="h-8 w-32 rounded-lg" />
  </div>
);

// Table row skeleton
export const TableRowSkeleton = ({ columns = 5 }: { columns?: number }) => (
  <tr>
    {Array.from({ length: columns }).map((_, i) => (
      <td key={i} className="p-4">
        <Skeleton className="h-4 w-full" />
      </td>
    ))}
  </tr>
);

// List of card skeletons
export const CardListSkeleton = ({ 
  count = 3, 
  className 
}: { 
  count?: number; 
  className?: string 
}) => (
  <div className={cn("space-y-4", className)}>
    {Array.from({ length: count }).map((_, i) => (
      <CardSkeleton key={i} />
    ))}
  </div>
);

// Grid of card skeletons
export const CardGridSkeleton = ({ 
  count = 4, 
  className 
}: { 
  count?: number; 
  className?: string 
}) => (
  <div className={cn("grid gap-4 md:grid-cols-2", className)}>
    {Array.from({ length: count }).map((_, i) => (
      <CardSkeleton key={i} />
    ))}
  </div>
);
