"use server";

import { revalidatePath } from "next/cache";
import type { ZodError } from "zod";

import { requireUser } from "@/lib/auth/session";
import { createQuoteSchema, quoteMutationSchema, type CreateQuoteInput, type QuoteMutationInput } from "@/schemas/quote.schema";
import { QuoteServiceError, quoteService } from "@/services/quote.service";

export type QuoteActionResult = { success: boolean; message: string; quoteId?: string; serviceOrderId?: string; fieldErrors?: Record<string, string[]> };

function validation(error: ZodError): QuoteActionResult {
  const fieldErrors: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const field = issue.path.join(".");
    fieldErrors[field] = [...(fieldErrors[field] ?? []), issue.message];
  }
  return { success: false, message: "Revise os campos destacados.", fieldErrors };
}

function failure(error: unknown): QuoteActionResult {
  if (error instanceof QuoteServiceError) return { success: false, message: error.message };
  console.error("Falha na operação de orçamento.", error);
  return { success: false, message: "Não foi possível concluir a operação agora." };
}

function revalidateQuote(quoteId: string, orderId?: string) {
  revalidatePath("/orcamentos");
  revalidatePath(`/orcamentos/${quoteId}`);
  if (orderId) revalidatePath(`/ordens-de-servico/${orderId}`);
}

export async function createQuoteAction(input: CreateQuoteInput): Promise<QuoteActionResult> {
  const user = await requireUser();
  const parsed = createQuoteSchema.safeParse(input);
  if (!parsed.success) return validation(parsed.error);
  try {
    const quote = await quoteService.create(parsed.data, user.id);
    revalidateQuote(quote.id, quote.serviceOrder?.id);
    return { success: true, message: "Orçamento criado com sucesso.", quoteId: quote.id };
  } catch (error) { return failure(error); }
}

async function mutate(input: QuoteMutationInput, operation: "send" | "approve" | "reject"): Promise<QuoteActionResult> {
  const user = await requireUser();
  const parsed = quoteMutationSchema.safeParse(input);
  if (!parsed.success) return validation(parsed.error);
  try {
    const quote = await quoteService[operation](parsed.data, user.id);
    revalidateQuote(quote.id, quote.serviceOrder?.id);
    return { success: true, message: operation === "send" ? "Orçamento enviado." : operation === "approve" ? "Orçamento aprovado. A ordem de serviço foi criada." : "Orçamento rejeitado.", quoteId: quote.id, serviceOrderId: quote.serviceOrder?.id };
  } catch (error) { return failure(error); }
}

export async function sendQuoteAction(input: QuoteMutationInput) { return mutate(input, "send"); }
export async function approveQuoteAction(input: QuoteMutationInput) { return mutate(input, "approve"); }
export async function rejectQuoteAction(input: QuoteMutationInput) { return mutate(input, "reject"); }
