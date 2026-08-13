import { ArrowLeft, CalendarDays, ClipboardList, Printer, UserRound } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { formatEquipmentName } from "@/components/equipment/equipment-formatters";
import { QuoteActions } from "@/components/quotes/quote-actions";
import { ShareQuotePdfButton } from "@/components/quotes/share-quote-pdf-button";
import { formatServiceOrderNumber } from "@/components/service-orders/service-order-formatters";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatBrazilianCurrency } from "@/lib/currency";
import { formatBrazilianDateTime } from "@/lib/dates";
import { requireUser } from "@/lib/auth/session";
import { cn } from "@/lib/utils";
import { quoteItemTypeLabels, quoteStatusLabels } from "@/schemas/quote.schema";
import { quoteService } from "@/services/quote.service";

export const metadata: Metadata = { title: "Detalhes do orçamento" };

function formatDate(date: Date | null) {
  return date ? new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo" }).format(date) : "Sem validade definida";
}

export default async function QuoteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireUser();
  const { id } = await params;
  const quote = await quoteService.getById(id);
  if (!quote) notFound();
  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link href="/orcamentos" className="mb-3 inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"><ArrowLeft className="size-3.5" aria-hidden="true" /> Voltar para orçamentos</Link>
          <div className="flex flex-wrap items-center gap-2"><h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Orçamento #{quote.number}</h1><Badge variant="secondary">{quoteStatusLabels[quote.status]}</Badge></div>
          <p className="mt-1 text-sm text-muted-foreground">Versão {quote.version} · criado por {quote.createdBy.name} em {formatBrazilianDateTime(quote.createdAt)}</p>
        </div>
        <div className="space-y-3">
          <QuoteActions quoteId={quote.id} status={quote.status} />
          <div className="flex flex-wrap gap-2">
            <ShareQuotePdfButton
              customerName={quote.serviceOrder.customer.name}
              quoteId={quote.id}
              quoteNumber={quote.number}
              version={quote.version}
            />
            <a href={`/api/pdfs/orcamentos/${quote.id}`} target="_blank" rel="noreferrer" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
              <Printer aria-hidden="true" /> Abrir PDF
            </a>
          </div>
        </div>
      </header>
      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <Card>
          <CardHeader className="border-b"><CardTitle>Itens</CardTitle><CardDescription>Descrição e valores preservados no momento da criação.</CardDescription></CardHeader>
          <CardContent className="px-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/30 text-left text-xs text-muted-foreground"><tr><th className="px-4 py-3">Tipo</th><th className="px-4 py-3">Descrição</th><th className="px-4 py-3 text-right">Qtd.</th><th className="px-4 py-3 text-right">Unitário</th><th className="px-4 py-3 text-right">Total</th></tr></thead>
                <tbody className="divide-y">{quote.items.map((item) => <tr key={item.id}><td className="px-4 py-3">{quoteItemTypeLabels[item.type]}</td><td className="px-4 py-3 font-medium">{item.description}</td><td className="px-4 py-3 text-right">{item.quantity.toString()}</td><td className="px-4 py-3 text-right">{formatBrazilianCurrency(item.unitPrice.toString())}</td><td className="px-4 py-3 text-right font-medium">{formatBrazilianCurrency(item.total.toString())}</td></tr>)}</tbody>
              </table>
            </div>
            <div className="ml-auto grid max-w-sm gap-2 border-t p-4 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{formatBrazilianCurrency(quote.subtotal.toString())}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Desconto</span><span>{formatBrazilianCurrency(quote.discount.toString())}</span></div>
              <div className="flex justify-between border-t pt-2 text-base font-semibold"><span>Total</span><span>{formatBrazilianCurrency(quote.total.toString())}</span></div>
            </div>
          </CardContent>
        </Card>
        <div className="space-y-4">
          <Card><CardHeader><CardTitle className="text-base">Referências</CardTitle></CardHeader><CardContent className="space-y-4 text-sm">
            <div className="flex gap-3"><ClipboardList className="size-4 text-muted-foreground" aria-hidden="true" /><div><p className="text-xs text-muted-foreground">Ordem</p><Link className="font-medium hover:text-primary" href={`/ordens-de-servico/${quote.serviceOrder.id}`}>{formatServiceOrderNumber(quote.serviceOrder.number)}</Link></div></div>
            <div className="flex gap-3"><UserRound className="size-4 text-muted-foreground" aria-hidden="true" /><div><p className="text-xs text-muted-foreground">Cliente</p><p className="font-medium">{quote.serviceOrder.customer.name}</p></div></div>
            <div className="flex gap-3"><ClipboardList className="size-4 text-muted-foreground" aria-hidden="true" /><div><p className="text-xs text-muted-foreground">Equipamento</p><p className="font-medium">{formatEquipmentName(quote.serviceOrder.equipment)}</p></div></div>
            <div className="flex gap-3"><CalendarDays className="size-4 text-muted-foreground" aria-hidden="true" /><div><p className="text-xs text-muted-foreground">Validade</p><p className="font-medium">{formatDate(quote.validUntil)}</p></div></div>
          </CardContent></Card>
          <Card><CardHeader><CardTitle className="text-base">Observações</CardTitle></CardHeader><CardContent><p className="text-sm whitespace-pre-wrap text-muted-foreground">{quote.notes ?? "Nenhuma observação."}</p></CardContent></Card>
        </div>
      </div>
    </div>
  );
}
