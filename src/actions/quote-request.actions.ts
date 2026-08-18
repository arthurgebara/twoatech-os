"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth/session";
import { quoteRequestFormSchema, quoteRequestIdSchema, quoteRequestStatusSchema, type QuoteRequestFormField, type QuoteRequestFormInput } from "@/schemas/quote-request.schema";
import { QuoteRequestServiceError, quoteRequestService } from "@/services/quote-request.service";

export type QuoteRequestActionResult = { success: boolean; message: string; fieldErrors?: Partial<Record<QuoteRequestFormField, string[]>> };

export async function createPublicQuoteRequestAction(input: QuoteRequestFormInput): Promise<QuoteRequestActionResult> {
  const parsed = quoteRequestFormSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: Partial<Record<QuoteRequestFormField, string[]>> = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0];
      if (typeof field === "string") fieldErrors[field as QuoteRequestFormField] = [issue.message];
    }
    return { success: false, message: "Revise os campos destacados.", fieldErrors };
  }
  try {
    await quoteRequestService.create(parsed.data);
    revalidatePath("/solicitacoes");
    return { success: true, message: "Solicitação recebida! A TwoATech entrará em contato pelo telefone informado." };
  } catch (error) {
    if (error instanceof QuoteRequestServiceError) return { success: false, message: error.message };
    console.error("Falha ao registrar solicitação pública.", error);
    return { success: false, message: "Não foi possível enviar agora. Tente novamente em instantes." };
  }
}

export async function setQuoteRequestStatusAction(id: string, status: string) {
  await requireUser();
  if (!quoteRequestIdSchema.safeParse(id).success || !quoteRequestStatusSchema.safeParse(status).success) return { success: false, message: "Solicitação inválida." };
  try {
    await quoteRequestService.setStatus(id, status);
    revalidatePath("/solicitacoes");
    return { success: true, message: "Situação atualizada." };
  } catch (error) {
    console.error("Falha ao atualizar solicitação.", error);
    return { success: false, message: "Não foi possível atualizar agora." };
  }
}
