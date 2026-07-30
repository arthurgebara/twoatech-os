import { Card, CardContent, CardHeader } from "@/components/ui/card";

function Skeleton({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-lg bg-muted ${className}`} />;
}

export default function EquipmentLoading() {
  return (
    <div
      className="space-y-6"
      aria-label="Carregando equipamentos"
      aria-busy="true"
    >
      <div className="flex items-end justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-80 max-w-full" />
        </div>
        <Skeleton className="hidden h-9 w-40 sm:block" />
      </div>
      <Skeleton className="h-28 w-full lg:h-16" />
      <Card>
        <CardHeader className="border-b">
          <Skeleton className="h-5 w-52" />
          <Skeleton className="h-4 w-32" />
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 5 }, (_, index) => (
            <Skeleton key={index} className="h-14 w-full" />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
