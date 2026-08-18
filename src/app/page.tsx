import { CheckCircle2, Clock3, Laptop, ShieldCheck } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { Brand } from "@/components/brand";
import { PublicQuoteRequestForm } from "@/components/quote-requests/public-quote-request-form";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Assistência técnica", description: "Solicite um orçamento para seu computador ou notebook." };

export default function HomePage() {
  return (
    <main className="min-h-dvh bg-background">
      <header className="border-b bg-background/90"><div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6"><Brand /><Link href="/login" className={cn(buttonVariants({ variant: "outline" }))}>Acesso interno</Link></div></header>
      <section className="relative overflow-hidden"><div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_15%,color-mix(in_oklch,var(--brand-lime)_20%,transparent),transparent_30%),radial-gradient(circle_at_90%_70%,color-mix(in_oklch,var(--brand-navy)_14%,transparent),transparent_35%)]" />
        <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 sm:py-20 lg:grid-cols-[1fr_0.9fr] lg:items-center">
          <div><p className="mb-4 inline-flex items-center gap-2 rounded-full border bg-background/70 px-3 py-1.5 text-xs"><CheckCircle2 className="size-4 text-primary" />Assistência especializada em computadores</p><h1 className="max-w-3xl text-4xl leading-tight font-semibold tracking-[-0.04em] sm:text-6xl">Seu computador funcionando bem, sem complicação.</h1><p className="mt-5 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">Conte o que está acontecendo. Analisamos sua solicitação e entramos em contato para orientar os próximos passos e preparar o orçamento.</p>
            <div className="mt-8 grid gap-3 sm:grid-cols-3">{[[Laptop,"Atendimento técnico"],[Clock3,"Retorno organizado"],[ShieldCheck,"Dados protegidos"]].map(([Icon,label]) => { const ItemIcon = Icon as typeof Laptop; return <div key={String(label)} className="flex items-center gap-2 rounded-xl border bg-card/70 p-3 text-sm shadow-xs"><ItemIcon className="size-4 text-primary" />{String(label)}</div>; })}</div>
          </div>
          <Card id="solicitar" className="bg-card/90 shadow-2xl shadow-foreground/10 backdrop-blur"><CardHeader><CardTitle className="text-2xl">Solicite seu orçamento</CardTitle><CardDescription>Preencha os dados abaixo. Isso não gera cobrança nem ordem de serviço.</CardDescription></CardHeader><CardContent><PublicQuoteRequestForm /></CardContent></Card>
        </div>
      </section>
      <footer className="border-t"><div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-6 text-xs text-muted-foreground sm:flex-row sm:justify-between sm:px-6"><span>© 2026 TwoATech. Assistência técnica.</span><span>Solicitações sujeitas à avaliação técnica.</span></div></footer>
    </main>
  );
}
