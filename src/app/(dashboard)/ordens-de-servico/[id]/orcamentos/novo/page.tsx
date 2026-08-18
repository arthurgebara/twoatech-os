import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "Novo orçamento" };

export default function LegacyNewQuotePage() {
  redirect("/orcamentos/novo");
}
