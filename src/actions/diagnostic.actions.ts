"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth/session";
import {
  saveDiagnosticSchema,
  type DiagnosticFormField,
  type SaveDiagnosticInput,
} from "@/schemas/diagnostic.schema";
import {
  DiagnosticServiceError,
  diagnosticService,
} from "@/services/diagnostic.service";

export type DiagnosticActionResult = {
  success: boolean;
  message: string;
  fieldErrors?: Partial<Record<DiagnosticFormField, string[]>>;
};

export async function saveDiagnosticAction(
  input: SaveDiagnosticInput,
): Promise<DiagnosticActionResult> {
  const user = await requireUser();
  const parsed = saveDiagnosticSchema.safeParse(input);

  if (!parsed.success) {
    const fieldErrors: Partial<Record<DiagnosticFormField, string[]>> = {};

    for (const issue of parsed.error.issues) {
      const field = issue.path[0];

      if (
        field === "description" ||
        field === "technicalConclusion" ||
        field === "recommendations"
      ) {
        fieldErrors[field] = [...(fieldErrors[field] ?? []), issue.message];
      }
    }

    return {
      success: false,
      message: "Revise os campos destacados e tente novamente.",
      fieldErrors,
    };
  }

  try {
    const order = await diagnosticService.save(parsed.data, user.id);
    revalidatePath("/ordens-de-servico");
    revalidatePath(`/ordens-de-servico/${order.id}`);

    return {
      success: true,
      message: "Diagnóstico registrado com sucesso.",
    };
  } catch (error) {
    if (error instanceof DiagnosticServiceError) {
      return {
        success: false,
        message: error.message,
      };
    }

    console.error("Falha ao salvar diagnóstico.", error);

    return {
      success: false,
      message:
        "Não foi possível salvar o diagnóstico agora. Tente novamente em instantes.",
    };
  }
}
