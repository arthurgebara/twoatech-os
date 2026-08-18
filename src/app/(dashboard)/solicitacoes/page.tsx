import { Inbox, MessageCircle } from "lucide-react";
import type { Metadata } from "next";

import { formatPhone } from "@/components/customers/customer-formatters";
import { QuoteRequestStatusActions } from "@/components/quote-requests/quote-request-status-actions";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatBrazilianDateTime } from "@/lib/dates";
import { requireUser } from "@/lib/auth/session";
import { equipmentTypeLabels } from "@/schemas/equipment.schema";
import { quoteRequestStatusLabels } from "@/schemas/quote-request.schema";
import { quoteRequestService } from "@/services/quote-request.service";

export const metadata: Metadata = { title: "Solicitações" };

export default async function QuoteRequestsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  await requireUser(); const { status } = await searchParams; const result = await quoteRequestService.list(status);
  return <div className="space-y-6"><header><h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Solicitações</h1><p className="mt-1 text-sm text-muted-foreground">Pedidos recebidos pela página pública para triagem e contato.</p></header>
    <form className="flex gap-2 rounded-xl border bg-card p-3"><select name="status" defaultValue={status ?? ""} className="h-9 rounded-md border bg-background px-3 text-sm"><option value="">Todas</option>{Object.entries(quoteRequestStatusLabels).map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select><button className="h-9 rounded-md bg-secondary px-3 text-sm font-medium">Filtrar</button></form>
    <Card><CardHeader className="border-b"><CardTitle>Caixa de entrada</CardTitle><CardDescription>{result.total} solicitação(ões)</CardDescription></CardHeader><CardContent className="px-0">{result.requests.length === 0 ? <div className="flex min-h-64 flex-col items-center justify-center text-center"><Inbox className="mb-3 size-8 text-muted-foreground" /><p className="font-medium">Nenhuma solicitação</p><p className="text-sm text-muted-foreground">Novos pedidos da home aparecerão aqui.</p></div> : <div className="divide-y">{result.requests.map((request) => <article key={request.id} className="space-y-4 p-4 sm:p-5"><div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between"><div><div className="flex flex-wrap items-center gap-2"><h2 className="font-semibold">{request.name}</h2><Badge variant="secondary">{quoteRequestStatusLabels[request.status]}</Badge></div><p className="mt-1 text-xs text-muted-foreground">{formatBrazilianDateTime(request.createdAt)} · {equipmentTypeLabels[request.equipmentType]}{request.equipmentDescription ? ` · ${request.equipmentDescription}` : ""}</p></div><a href={`https://wa.me/55${request.phone}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"><MessageCircle className="size-4" />{formatPhone(request.phone)}</a></div><p className="whitespace-pre-wrap text-sm leading-6">{request.reportedProblem}</p>{request.email ? <p className="text-xs text-muted-foreground">E-mail: {request.email}</p> : null}<QuoteRequestStatusActions id={request.id} status={request.status} /></article>)}</div>}</CardContent></Card>
  </div>;
}
