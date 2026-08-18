"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export async function completeQuickstartAction() {
  const user = await requireUser();
  await prisma.user.update({ where: { id: user.id }, data: { hasCompletedQuickstart: true } });
  revalidatePath("/dashboard", "layout");
  return { success: true };
}
