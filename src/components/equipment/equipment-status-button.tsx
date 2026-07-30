"use client";

import { LoaderCircle, Power, PowerOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { setEquipmentActiveAction } from "@/actions/equipment.actions";
import { Button } from "@/components/ui/button";

type EquipmentStatusButtonProps = {
  equipmentId: string;
  isActive: boolean;
};

export function EquipmentStatusButton({
  equipmentId,
  isActive,
}: EquipmentStatusButtonProps) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleStatusChange() {
    const nextStatus = !isActive;
    const confirmed = window.confirm(
      nextStatus
        ? "Deseja ativar este equipamento?"
        : "Deseja inativar este equipamento? O histórico será preservado.",
    );

    if (!confirmed) {
      return;
    }

    setMessage(null);
    startTransition(async () => {
      const result = await setEquipmentActiveAction(equipmentId, nextStatus);
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
        {isPending
          ? "Atualizando..."
          : isActive
            ? "Inativar equipamento"
            : "Ativar equipamento"}
      </Button>
      {message ? (
        <p className="max-w-xs text-xs text-muted-foreground" role="status">
          {message}
        </p>
      ) : null}
    </div>
  );
}
