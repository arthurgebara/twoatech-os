"use client";

import { ModuleError } from "@/components/layout/module-error";

export default function QuotesError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <ModuleError title="Não foi possível carregar os orçamentos" reset={reset} />;
}
