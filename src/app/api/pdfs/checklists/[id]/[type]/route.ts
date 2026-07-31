import { requireUser } from "@/lib/auth/session";
import { generateChecklistPdf } from "@/lib/pdf/generate-pdf";
import { pdfDocumentService } from "@/services/pdf-document.service";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; type: string }> },
) {
  await requireUser();
  const { id, type } = await params;
  const checklistType = type === "entrada" ? "ENTRY" : type === "saida" ? "EXIT" : null;
  if (!checklistType) return new Response("Tipo de checklist inválido.", { status: 400 });
  const dto = await pdfDocumentService.getChecklist(id, checklistType);
  if (!dto) return new Response("Checklist não encontrada.", { status: 404 });
  const pdf = await generateChecklistPdf(dto);
  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="checklist-${type}-os-${dto.serviceOrderNumber}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
