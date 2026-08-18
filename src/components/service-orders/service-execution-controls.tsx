"use client";

import { LoaderCircle, PackageCheck, Pause, Play } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import {
  receivePartAction,
  startServiceAction,
  waitForPartAction,
  type ServiceExecutionActionResult,
} from "@/actions/service-execution.actions";
import { Button } from "@/components/ui/button";
import type { ServiceOrderStatus } from "@/generated/prisma/enums";

type Action = (input: { serviceOrderId: string; idempotencyKey: string }) => Promise<ServiceExecutionActionResult>;

export function ServiceExecutionControls({ serviceOrderId, status }: { serviceOrderId: string; status: ServiceOrderStatus }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState("");
  function run(action: Action) {
    startTransition(async () => {
      const result = await action({ serviceOrderId, idempotencyKey: crypto.randomUUID() });
      setMessage(result.message);
      if (result.success) router.refresh();
    });
  }
  const control =
    status === "APPROVED" ? { action: startServiceAction, icon: Play, label: "Iniciar serviço" } :
    status === "IN_PROGRESS" ? null :
    status === "WAITING_PART" ? { action: receivePartAction, icon: PackageCheck, label: "Registrar peça recebida" } :
    null;
  if (!control && status !== "IN_PROGRESS") return null;
  return (
    <div className="space-y-2 rounded-xl border bg-card p-4">
      <div className="flex flex-wrap gap-2">
        {control ? <Button disabled={pending} onClick={() => run(control.action)}><control.icon aria-hidden="true" />{control.label}</Button> : null}
        {status === "IN_PROGRESS" ? (
          <>
            <Button variant="outline" disabled={pending} onClick={() => run(waitForPartAction)}><Pause aria-hidden="true" />Aguardar peça</Button>
          </>
        ) : null}
        {pending ? <LoaderCircle className="size-5 animate-spin self-center" aria-hidden="true" /> : null}
      </div>
      {message ? <p className="text-xs text-muted-foreground" aria-live="polite">{message}</p> : null}
    </div>
  );
}
