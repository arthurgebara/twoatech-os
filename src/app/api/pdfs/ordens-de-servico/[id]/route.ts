import { requireUser } from "@/lib/auth/session";
import { generateServiceOrderPdf } from "@/lib/pdf/generate-pdf";
import { pdfDocumentService } from "@/services/pdf-document.service";

export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireUser();
  const { id } = await params;
  const includeTimeline = new URL(request.url).searchParams.get("timeline") === "1";
  const dto = await pdfDocumentService.getServiceOrder(id, includeTimeline);
  if (!dto) return new Response("Ordem de serviço não encontrada.", { status: 404 });
  const pdf = await generateServiceOrderPdf(dto);
  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="ordem-servico-${dto.number}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
