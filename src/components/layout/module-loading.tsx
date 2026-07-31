import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function ModuleLoading() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Carregando conteúdo">
      <div className="space-y-2"><div className="h-8 w-52 animate-pulse rounded bg-muted" /><div className="h-4 w-80 max-w-full animate-pulse rounded bg-muted" /></div>
      <div className="h-16 animate-pulse rounded-xl border bg-card" />
      <Card>
        <CardHeader><div className="h-5 w-44 animate-pulse rounded bg-muted" /></CardHeader>
        <CardContent className="space-y-3">{Array.from({ length: 5 }, (_, index) => <div key={index} className="h-14 animate-pulse rounded-lg bg-muted/60" />)}</CardContent>
      </Card>
    </div>
  );
}
