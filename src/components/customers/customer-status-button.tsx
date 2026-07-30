"use client";

import { LoaderCircle, Power, PowerOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { setCustomerActiveAction } from "@/actions/customer.actions";
import { Button } from "@/components/ui/button";

type CustomerStatusButtonProps = {
  customerId: string;
  isActive: boolean;
};

export function CustomerStatusButton({
  customerId,
  isActive,
}: CustomerStatusButtonProps) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleStatusChange() {
    const nextStatus = !isActive;
    const confirmed = window.confirm(
      nextStatus
        ? "Deseja ativar este cliente?"
        : "Deseja inativar este cliente? O histórico será preservado.",
    );

    if (!confirmed) {
      return;
    }

    setMessage(null);
    startTransition(async () => {
      const result = await setCustomerActiveAction(customerId, nextStatus);
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
        size="lg"
        onClick={handleStatusChange}
        disabled={isPending}
      >
        {isPending ? (
          <LoaderCircle className="animate-spin" aria-hidden="true" />
        ) : isActive ? (
          <PowerOff aria-hidden="true" />
        ) : (
          <Power aria-hidden="true" />
        )}
        {isPending ? "Atualizando..." : isActive ? "Inativar cliente" : "Ativar cliente"}
      </Button>
      {message ? (
        <p className="max-w-xs text-xs text-muted-foreground" role="status">
          {message}
        </p>
      ) : null}
    </div>
  );
}
