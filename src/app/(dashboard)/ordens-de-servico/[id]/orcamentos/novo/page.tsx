import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "Novo orçamento" };

export default async function NewQuoteForIntakePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/orcamentos/novo?atendimento=${encodeURIComponent(id)}`);
}
