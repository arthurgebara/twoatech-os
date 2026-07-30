"use client";

import { LoaderCircle, Power, PowerOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { setServiceCatalogItemActiveAction } from "@/actions/service-catalog.actions";
import { Button } from "@/components/ui/button";

export function ServiceCatalogStatusButton({
  serviceId,
  isActive,
}: {
  serviceId: string;
  isActive: boolean;
}) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function changeStatus() {
    if (
      !window.confirm(
        isActive
          ? "Inativar este serviço? Ele não aparecerá em novos orçamentos."
          : "Ativar este serviço?",
      )
    ) {
      return;
    }

    startTransition(async () => {
      const result = await setServiceCatalogItemActiveAction(
        serviceId,
        !isActive,
      );
      setMessage(result.message);

      if (result.success) {
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant={isActive ? "destructive" : "outline"}
        onClick={changeStatus}
        disabled={isPending}
      >
        {isPending ? (
          <LoaderCircle className="animate-spin" aria-hidden="true" />
        ) : isActive ? (
          <PowerOff aria-hidden="true" />
        ) : (
          <Power aria-hidden="true" />
        )}
        {isPending ? "Atualizando..." : isActive ? "Inativar" : "Ativar"}
      </Button>
      {message ? (
        <p className="text-xs text-muted-foreground" role="status">
          {message}
        </p>
      ) : null}
    </div>
  );
}
