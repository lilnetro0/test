import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/** List of avatar + two text lines — Friends / Notifications / DM inbox. */
export function ListSkeleton({ rows = 6, className }: { rows?: number; className?: string }) {
  return (
    <div className={cn("space-y-1", className)} aria-hidden>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex min-h-11 items-center gap-3 px-4 py-3">
          <Skeleton className="size-10 shrink-0 rounded-full bg-white/10" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-3.5 w-2/5 bg-white/10" />
            <Skeleton className="h-3 w-4/5 bg-white/5" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Full-bleed media block + title lines — Game / Hub / Discover hero. */
export function HeroSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-4", className)} aria-hidden>
      <Skeleton className="aspect-[16/9] w-full rounded-none bg-white/10" />
      <div className="space-y-2 px-4">
        <Skeleton className="h-5 w-1/2 bg-white/10" />
        <Skeleton className="h-3.5 w-3/4 bg-white/5" />
        <Skeleton className="mt-4 h-11 w-full rounded-lg bg-white/10" />
      </div>
    </div>
  );
}
