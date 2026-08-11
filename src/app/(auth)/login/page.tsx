import type { Metadata } from "next";
import { CheckCircle2, Cpu, Gauge, ShieldCheck } from "lucide-react";

import { Brand } from "@/components/brand";
import { LoginForm } from "@/components/auth/login-form";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Entrar",
  description: "Acesso interno ao TwoATech OS.",
};

const highlights = [
  { icon: Gauge, text: "Atendimento rápido e organizado" },
  { icon: Cpu, text: "Fluxo pensado para computadores" },
  { icon: ShieldCheck, text: "Dados protegidos e rastreáveis" },
];

export default function LoginPage() {
  return (
    <main className="relative min-h-dvh overflow-hidden bg-background">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,color-mix(in_oklch,var(--brand-lime)_18%,transparent),transparent_30%),radial-gradient(circle_at_85%_80%,color-mix(in_oklch,var(--brand-navy)_12%,transparent),transparent_30%)] dark:bg-[radial-gradient(circle_at_15%_20%,color-mix(in_oklch,var(--brand-lime)_10%,transparent),transparent_30%),radial-gradient(circle_at_85%_80%,color-mix(in_oklch,var(--brand-lime)_5%,transparent),transparent_30%)]" />
      <div className="relative mx-auto grid min-h-dvh max-w-7xl lg:grid-cols-[1.08fr_0.92fr]">
        <section className="hidden border-r border-border/70 p-12 lg:flex lg:flex-col lg:justify-between xl:p-16">
          <Brand />

          <div className="max-w-xl pb-8">
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border bg-background/70 px-3 py-1.5 text-xs text-muted-foreground shadow-sm backdrop-blur">
              <CheckCircle2 className="size-3.5 text-primary" />
              Operação técnica em um só lugar
            </div>
            <h1 className="text-5xl leading-[1.06] font-semibold tracking-[-0.045em] text-balance xl:text-6xl">
              Menos planilhas.
              <br />
              Mais computadores prontos.
            </h1>
            <p className="mt-6 max-w-lg text-base leading-7 text-muted-foreground">
              O fluxo completo da assistência técnica, do recebimento à entrega,
              com informações claras e histórico confiável.
            </p>

            <div className="mt-10 grid gap-3">
              {highlights.map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-3 text-sm">
                  <span className="flex size-8 items-center justify-center rounded-lg border bg-card shadow-xs">
                    <Icon className="size-4" aria-hidden="true" />
                  </span>
                  <span>{text}</span>
                </div>
              ))}
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            © 2026 TwoATech. Uso interno.
          </p>
        </section>

        <section className="flex min-h-dvh flex-col p-5 sm:p-8 lg:p-12">
          <div className="flex items-center justify-between lg:justify-end">
            <Brand className="lg:hidden" />
            <ThemeToggle />
          </div>

          <div className="flex flex-1 items-center justify-center py-10">
            <Card className="w-full max-w-md border-0 bg-card/85 py-0 shadow-2xl shadow-foreground/5 ring-1 ring-foreground/10 backdrop-blur-xl">
              <CardHeader className="gap-2 px-6 pt-7 sm:px-8 sm:pt-8">
                <CardTitle className="text-2xl font-semibold tracking-tight">
                  Bem-vindo de volta
                </CardTitle>
                <CardDescription className="leading-6">
                  Entre com suas credenciais para acessar o TwoATech OS.
                </CardDescription>
              </CardHeader>
              <CardContent className="px-6 pt-3 pb-7 sm:px-8 sm:pb-8">
                <LoginForm />
              </CardContent>
            </Card>
          </div>

          <p className="text-center text-xs text-muted-foreground lg:hidden">
            Sistema interno da TwoATech
          </p>
        </section>
      </div>
    </main>
  );
}
