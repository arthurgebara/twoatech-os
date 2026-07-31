import { requireUser } from "@/lib/auth/session";
import { generateQuotePdf } from "@/lib/pdf/generate-pdf";
import { pdfDocumentService } from "@/services/pdf-document.service";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireUser();
  const { id } = await params;
  const dto = await pdfDocumentService.getQuote(id);
  if (!dto) return new Response("Orçamento não encontrado.", { status: 404 });
  const pdf = await generateQuotePdf(dto);
  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="orcamento-${dto.number}-v${dto.version}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
