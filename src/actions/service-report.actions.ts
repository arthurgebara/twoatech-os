"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth/session";
import { saveServiceReportSchema, type SaveServiceReportInput, type ServiceReportFormField } from "@/schemas/service-report.schema";
import { ServiceReportError, serviceReportService } from "@/services/service-report.service";

export type ServiceReportActionResult = { success: boolean; message: string; fieldErrors?: Partial<Record<ServiceReportFormField, string[]>> };

export async function saveServiceReportAction(input: SaveServiceReportInput): Promise<ServiceReportActionResult> {
  const user = await requireUser();
  const parsed = saveServiceReportSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: Partial<Record<ServiceReportFormField, string[]>> = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0];
      if (field === "workPerformed" || field === "partsUsed" || field === "testsPerformed" || field === "notes") fieldErrors[field] = [...(fieldErrors[field] ?? []), issue.message];
    }
    return { success: false, message: "Revise os campos destacados.", fieldErrors };
  }
  try {
    await serviceReportService.save(parsed.data, user.id);
    revalidatePath(`/ordens-de-servico/${parsed.data.serviceOrderId}`);
    revalidatePath("/ordens-de-servico");
    revalidatePath("/dashboard");
    return { success: true, message: "Relatório registrado e serviço concluído." };
  } catch (error) {
    if (error instanceof ServiceReportError) return { success: false, message: error.message };
    console.error("Falha ao registrar relatório do serviço.", error);
    return { success: false, message: "Não foi possível registrar o relatório agora." };
  }
}
