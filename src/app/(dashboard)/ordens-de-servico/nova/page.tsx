import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "Novo atendimento" };

export default function LegacyNewServiceOrderPage() {
  redirect("/orcamentos/novo");
}
