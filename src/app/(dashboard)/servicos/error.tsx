"use client";

import { ModuleError } from "@/components/layout/module-error";

export default function ServicesError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <ModuleError title="Não foi possível carregar a tabela de serviços" reset={reset} />;
}
