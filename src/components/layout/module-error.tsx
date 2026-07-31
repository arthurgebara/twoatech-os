"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function ModuleError({ title, reset }: { title: string; reset: () => void }) {
  return (
    <Card>
      <CardContent className="flex min-h-80 flex-col items-center justify-center text-center">
        <AlertTriangle className="mb-3 size-9 text-destructive" aria-hidden="true" />
        <h1 className="text-lg font-semibold">{title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">Tente novamente em instantes.</p>
        <Button variant="outline" className="mt-4" onClick={reset}><RefreshCw aria-hidden="true" />Tentar novamente</Button>
      </CardContent>
    </Card>
  );
}
