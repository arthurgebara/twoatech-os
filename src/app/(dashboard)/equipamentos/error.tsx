"use client";

import { AlertTriangle, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function EquipmentError({
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  return (
    <Card className="min-h-[360px] shadow-xs">
      <CardContent className="flex flex-1 flex-col items-center justify-center py-16 text-center">
        <span className="mb-4 flex size-12 items-center justify-center rounded-2xl border border-destructive/20 bg-destructive/5">
          <AlertTriangle className="size-5 text-destructive" aria-hidden="true" />
        </span>
        <h1 className="text-sm font-medium">
          Não foi possível carregar os equipamentos
        </h1>
        <p className="mt-1 max-w-sm text-xs leading-5 text-muted-foreground">
          Verifique sua conexão e tente novamente. Nenhuma informação foi
          alterada.
        </p>
        <Button
          type="button"
          variant="outline"
          className="mt-4"
          onClick={unstable_retry}
        >
          <RotateCcw aria-hidden="true" />
          Tentar novamente
        </Button>
      </CardContent>
    </Card>
  );
}
