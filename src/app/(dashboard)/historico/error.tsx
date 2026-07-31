"use client";

import { ModuleError } from "@/components/layout/module-error";

export default function HistoryError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <ModuleError title="Não foi possível carregar o histórico" reset={reset} />;
}
