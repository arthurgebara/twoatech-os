import "server-only";

import { quoteRequestRepository } from "@/repositories/quote-request.repository";
import { quoteRequestFormSchema, quoteRequestIdSchema, quoteRequestStatusSchema, type QuoteRequestFormInput } from "@/schemas/quote-request.schema";

export class QuoteRequestServiceError extends Error {
  constructor(message: string) { super(message); this.name = "QuoteRequestServiceError"; }
}

export const quoteRequestService = {
  async create(input: QuoteRequestFormInput) {
    const parsed = quoteRequestFormSchema.parse(input);
    const recent = await quoteRequestRepository.findRecentByPhone(parsed.phone, new Date(Date.now() - 5 * 60 * 1000));
    if (recent) throw new QuoteRequestServiceError("Já recebemos uma solicitação deste telefone. Aguarde alguns minutos antes de enviar novamente.");
    return quoteRequestRepository.create({
      name: parsed.name,
      phone: parsed.phone,
      email: parsed.email || null,
      equipmentType: parsed.equipmentType,
      equipmentDescription: parsed.equipmentDescription || null,
      reportedProblem: parsed.reportedProblem,
    });
  },
  list(status?: string) {
    const parsed = quoteRequestStatusSchema.safeParse(status);
    return quoteRequestRepository.list(parsed.success ? parsed.data : undefined);
  },
  setStatus(id: string, status: string) {
    const parsedId = quoteRequestIdSchema.parse(id);
    const parsedStatus = quoteRequestStatusSchema.parse(status);
    return quoteRequestRepository.setStatus(parsedId, parsedStatus, parsedStatus === "CONTACTED" ? new Date() : null);
  },
};
