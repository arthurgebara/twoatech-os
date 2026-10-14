import Image from "next/image";

import { cn } from "@/lib/utils";

type BrandProps = {
  compact?: boolean;
  className?: string;
};

export function Brand({ compact = false, className }: BrandProps) {
  return (
    <div className={cn("group/brand flex items-center gap-3", className)}>
      <Image
        src="/twoatech-logo.png"
        alt={compact ? "TwoATech OS" : ""}
        width={40}
        height={40}
        className={cn(
          "size-10 shrink-0 transition-transform duration-300 ease-out group-hover/brand:-rotate-3 group-hover/brand:scale-105",
          compact && "size-9",
        )}
        priority
      />
      {!compact && (
        <div className="min-w-0">
          <p className="truncate text-sm font-bold tracking-tight">
            TwoATech OS
          </p>
          <p className="truncate text-[11px] text-current opacity-60">
            Assistência técnica
          </p>
        </div>
      )}
    </div>
  );
}
