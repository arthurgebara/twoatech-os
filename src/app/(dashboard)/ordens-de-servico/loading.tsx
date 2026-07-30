import { Card, CardContent, CardHeader } from "@/components/ui/card";

function Skeleton({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-lg bg-muted ${className}`} />;
}

export default function ServiceOrdersLoading() {
  return (
    <div
      className="space-y-6"
      aria-label="Carregando ordens de serviço"
      aria-busy="true"
    >
      <div className="flex items-end justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-4 w-80 max-w-full" />
        </div>
        <Skeleton className="hidden h-9 w-32 sm:block" />
      </div>
      <Skeleton className="h-16 w-full" />
      <Card>
        <CardHeader className="border-b">
          <Skeleton className="h-5 w-44" />
          <Skeleton className="h-4 w-28" />
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
