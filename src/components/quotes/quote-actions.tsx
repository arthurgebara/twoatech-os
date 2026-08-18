"use client";

import { Check, LoaderCircle, Send, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { approveQuoteAction, rejectQuoteAction, sendQuoteAction, type QuoteActionResult } from "@/actions/quote.actions";
import { Button } from "@/components/ui/button";
import type { QuoteStatus } from "@/generated/prisma/enums";

export function QuoteActions({ quoteId, status }: { quoteId: string; status: QuoteStatus }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState("");

  function run(action: (input: { quoteId: string; idempotencyKey: string }) => Promise<QuoteActionResult>) {
    startTransition(async () => {
      const result = await action({ quoteId, idempotencyKey: crypto.randomUUID() });
      setMessage(result.message);
      if (result.success && result.serviceOrderId) {
        router.push(`/ordens-de-servico/${result.serviceOrderId}`);
        return;
      }
      if (result.success) router.refresh();
    });
  }

  if (status !== "DRAFT" && status !== "SENT") return null;
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {status === "DRAFT" ? <Button disabled={pending} onClick={() => run(sendQuoteAction)}><Send aria-hidden="true" /> Enviar orçamento</Button> : (
          <>
            <Button disabled={pending} onClick={() => run(approveQuoteAction)}><Check aria-hidden="true" /> Aprovar</Button>
            <Button variant="destructive" disabled={pending} onClick={() => run(rejectQuoteAction)}><X aria-hidden="true" /> Rejeitar</Button>
          </>
        )}
        {pending ? <LoaderCircle className="size-5 animate-spin self-center" aria-hidden="true" /> : null}
      </div>
      {message ? <p className="text-sm text-muted-foreground" aria-live="polite">{message}</p> : null}
    </div>
  );
}
