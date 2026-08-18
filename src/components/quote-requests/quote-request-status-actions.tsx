"use client";

import { Check, LoaderCircle, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { setQuoteRequestStatusAction } from "@/actions/quote-request.actions";
import { Button } from "@/components/ui/button";

export function QuoteRequestStatusActions({ id, status }: { id: string; status: "NEW" | "CONTACTED" | "DISMISSED" }) {
  const router = useRouter(); const [loading, setLoading] = useState(false); const [message, setMessage] = useState("");
  async function update(next: "CONTACTED" | "DISMISSED") { setLoading(true); const result = await setQuoteRequestStatusAction(id, next); setMessage(result.message); setLoading(false); if (result.success) router.refresh(); }
  if (status !== "NEW") return null;
  return <div className="flex flex-wrap items-center gap-2"><Button type="button" size="sm" disabled={loading} onClick={() => void update("CONTACTED")}>{loading ? <LoaderCircle className="animate-spin" /> : <Check />}Contato realizado</Button><Button type="button" size="sm" variant="ghost" disabled={loading} onClick={() => void update("DISMISSED")}><X />Descartar</Button>{message ? <span className="text-xs text-muted-foreground">{message}</span> : null}</div>;
}
