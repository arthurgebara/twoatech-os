import { requireUser } from "@/lib/auth/session";
import { checklistAttachmentService } from "@/services/checklist-attachment.service";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireUser();
  const { id } = await params;
  const signedUrl = await checklistAttachmentService.createViewUrl(id);
  if (!signedUrl) return Response.json({ message: "Anexo não encontrado." }, { status: 404 });
  return Response.redirect(signedUrl, 307);
}
