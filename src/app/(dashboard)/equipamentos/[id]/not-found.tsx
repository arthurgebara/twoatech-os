import { ArrowLeft, Laptop } from "lucide-react";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default function EquipmentNotFound() {
  return (
    <Card className="min-h-[360px] shadow-xs">
      <CardContent className="flex flex-1 flex-col items-center justify-center py-16 text-center">
        <span className="mb-4 flex size-12 items-center justify-center rounded-2xl border bg-muted/50">
          <Laptop className="size-5 text-muted-foreground" aria-hidden="true" />
        </span>
        <h1 className="text-sm font-medium">Equipamento não encontrado</h1>
        <p className="mt-1 max-w-sm text-xs leading-5 text-muted-foreground">
          O cadastro pode não existir ou o endereço informado está incorreto.
        </p>
        <Link
          href="/equipamentos"
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            "mt-4",
          )}
        >
          <ArrowLeft aria-hidden="true" />
          Voltar para equipamentos
        </Link>
      </CardContent>
    </Card>
  );
}
