"use client";

import { LoaderCircle, PackageCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { receiveEquipmentAction } from "@/actions/service-order.actions";
import { Button } from "@/components/ui/button";

export function ReceiveEquipmentButton({
  serviceOrderId,
  idempotencyKey,
}: {
  serviceOrderId: string;
  idempotencyKey: string;
}) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleReceive() {
    const confirmed = window.confirm(
      "Confirma o recebimento físico deste equipamento?",
    );

    if (!confirmed) {
      return;
    }

    setMessage(null);
    startTransition(async () => {
      const result = await receiveEquipmentAction({
        serviceOrderId,
        idempotencyKey,
      });
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
        size="lg"
        onClick={handleReceive}
        disabled={isPending}
      >
        {isPending ? (
          <LoaderCircle className="animate-spin" aria-hidden="true" />
        ) : (
          <PackageCheck aria-hidden="true" />
        )}
        {isPending ? "Registrando..." : "Registrar recebimento"}
      </Button>
      {message ? (
        <p className="max-w-xs text-xs text-muted-foreground" role="status">
          {message}
        </p>
      ) : null}
    </div>
  );
}
