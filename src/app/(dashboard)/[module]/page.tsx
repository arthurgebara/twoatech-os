import type { Metadata } from "next";
import { Construction } from "lucide-react";
import { notFound } from "next/navigation";

import { Card, CardContent } from "@/components/ui/card";

const modules = {
  clientes: {
    title: "Clientes",
    description: "Cadastro e consulta dos clientes da assistência técnica.",
  },
  equipamentos: {
    title: "Equipamentos",
    description: "Computadores e notebooks vinculados a cada cliente.",
  },
  "ordens-de-servico": {
    title: "Ordens de Serviço",
    description: "Acompanhamento completo de cada atendimento.",
  },
  orcamentos: {
    title: "Orçamentos",
    description: "Propostas, itens e aprovações dos serviços.",
  },
  checklists: {
    title: "Checklists",
    description: "Conferências de entrada e saída dos equipamentos.",
  },
  servicos: {
    title: "Tabela de Serviços",
    description: "Catálogo padronizado dos serviços da TwoATech.",
  },
  historico: {
    title: "Histórico",
    description: "Linha do tempo imutável dos atendimentos.",
  },
  configuracoes: {
    title: "Configurações",
    description: "Preferências e dados do sistema.",
  },
} as const;

type ModuleKey = keyof typeof modules;

function isModuleKey(value: string): value is ModuleKey {
  return value in modules;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ module: string }>;
}): Promise<Metadata> {
  const { module } = await params;
  return { title: isModuleKey(module) ? modules[module].title : "Não encontrado" };
}

export default async function ModulePage({
  params,
}: {
  params: Promise<{ module: string }>;
}) {
  const { module } = await params;

  if (!isModuleKey(module)) {
    notFound();
  }

  const currentModule = modules[module];

  return (
    <div className="space-y-7">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          {currentModule.title}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {currentModule.description}
        </p>
      </header>

      <Card className="min-h-[420px] shadow-xs">
        <CardContent className="flex flex-1 flex-col items-center justify-center py-16 text-center">
          <span className="mb-4 flex size-12 items-center justify-center rounded-2xl border bg-muted/50">
            <Construction className="size-5 text-muted-foreground" aria-hidden="true" />
          </span>
          <h2 className="text-sm font-medium">Módulo preparado para a próxima etapa</h2>
          <p className="mt-1 max-w-sm text-xs leading-5 text-muted-foreground">
            A navegação e a estrutura responsiva já estão prontas. As regras e formulários serão adicionados fase a fase.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
