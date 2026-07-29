import { Wrench } from "lucide-react";

import { cn } from "@/lib/utils";

type BrandProps = {
  compact?: boolean;
  className?: string;
};

export function Brand({ compact = false, className }: BrandProps) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-foreground text-background shadow-sm">
        <Wrench className="size-4" aria-hidden="true" />
      </div>
      {!compact && (
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold tracking-tight">
            TwoATech OS
          </p>
          <p className="truncate text-[11px] text-muted-foreground">
            Assistência técnica
          </p>
        </div>
      )}
    </div>
  );
}
