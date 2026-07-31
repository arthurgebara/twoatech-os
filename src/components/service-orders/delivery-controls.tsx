"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Ban, CheckCheck, LoaderCircle, PackageCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";

import {
  cancelServiceOrderAction,
  deliverEquipmentAction,
  markEquipmentReadyAction,
  type DeliveryActionResult,
} from "@/actions/delivery.actions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import type { ServiceOrderStatus } from "@/generated/prisma/enums";
import { cancelServiceOrderSchema, type CancelServiceOrderInput } from "@/schemas/delivery.schema";

type CommandAction = (input: { serviceOrderId: string; idempotencyKey: string }) => Promise<DeliveryActionResult>;

export function DeliveryControls({ serviceOrderId, status }: { serviceOrderId: string; status: ServiceOrderStatus }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [showCancel, setShowCancel] = useState(false);
  const [message, setMessage] = useState("");
  const { register, handleSubmit, setError, reset, formState: { errors, isSubmitting } } = useForm<CancelServiceOrderInput>({
    resolver: zodResolver(cancelServiceOrderSchema),
    defaultValues: { serviceOrderId, idempotencyKey: crypto.randomUUID(), reason: "" },
  });
  function run(action: CommandAction) {
    startTransition(async () => {
      const result = await action({ serviceOrderId, idempotencyKey: crypto.randomUUID() });
      setMessage(result.message);
      if (result.success) router.refresh();
    });
  }
  async function cancel(values: CancelServiceOrderInput) {
    if (!window.confirm("Cancelar esta ordem de serviço?")) return;
    const result = await cancelServiceOrderAction(values);
    setMessage(result.message);
    if (!result.success) setError("root", { message: result.message });
    else {
      reset({ serviceOrderId, idempotencyKey: crypto.randomUUID(), reason: "" });
      router.refresh();
    }
  }
  if (status === "DELIVERED" || status === "CANCELED") return null;
  return (
    <div className="space-y-3 rounded-xl border bg-card p-4">
      <div className="flex flex-wrap gap-2">
        {status === "COMPLETED" ? <Button disabled={pending} onClick={() => run(markEquipmentReadyAction)}><PackageCheck aria-hidden="true" />Marcar equipamento pronto</Button> : null}
        {status === "READY_FOR_PICKUP" ? <Button disabled={pending} onClick={() => run(deliverEquipmentAction)}><CheckCheck aria-hidden="true" />Registrar entrega</Button> : null}
        <Button variant="outline" disabled={pending} onClick={() => setShowCancel((value) => !value)}><Ban aria-hidden="true" />Cancelar ordem</Button>
        {pending ? <LoaderCircle className="size-5 animate-spin self-center" aria-hidden="true" /> : null}
      </div>
      {showCancel ? <form onSubmit={handleSubmit(cancel)} className="space-y-2 rounded-lg border border-destructive/20 bg-destructive/5 p-3">
        <Label htmlFor="cancel-reason">Motivo do cancelamento</Label>
        <textarea id="cancel-reason" rows={3} className="w-full rounded-lg border bg-background px-3 py-2 text-sm" {...register("reason")} />
        {errors.reason?.message ? <p className="text-xs text-destructive">{errors.reason.message}</p> : null}
        {errors.root?.message ? <p className="text-xs text-destructive">{errors.root.message}</p> : null}
        <Button type="submit" variant="destructive" size="sm" disabled={isSubmitting}>Confirmar cancelamento</Button>
      </form> : null}
      {message ? <p className="text-xs text-muted-foreground" role="status">{message}</p> : null}
    </div>
  );
}
