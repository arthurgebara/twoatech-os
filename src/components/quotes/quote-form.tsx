"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle, Plus, Save, Trash2 } from "lucide-react";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { Controller, useFieldArray, useForm, useWatch } from "react-hook-form";

import { createQuoteAction } from "@/actions/quote.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { decimalToBrlInput, formatBrazilianCurrency, maskBrlInput } from "@/lib/currency";
import { parseBrlValue } from "@/schemas/service-catalog.schema";
import { createQuoteSchema, quoteItemTypeLabels, type CreateQuoteInput } from "@/schemas/quote.schema";

type CatalogOption = { id: string; name: string; description: string | null; defaultPrice: { toString(): string } };

export function QuoteForm({
  serviceOrderId,
  idempotencyKey,
  catalog,
}: {
  serviceOrderId: string;
  idempotencyKey: string;
  catalog: CatalogOption[];
}) {
  const router = useRouter();
  const { control, register, handleSubmit, setError, setValue, formState: { errors, isSubmitting } } =
    useForm<CreateQuoteInput>({
      resolver: zodResolver(createQuoteSchema),
      defaultValues: {
        serviceOrderId,
        idempotencyKey,
        validUntil: "",
        notes: "",
        discount: "R$ 0,00",
        items: [{ type: "SERVICE", serviceCatalogItemId: "", description: "", quantity: "1", unitPrice: "R$ 0,00" }],
      },
    });
  const { fields, append, remove } = useFieldArray({ control, name: "items" });
  const watchedItems = useWatch({ control, name: "items" });
  const watchedDiscount = useWatch({ control, name: "discount" });
  const subtotal = watchedItems.reduce((sum, item) => {
    const quantity = Number(item.quantity.replace(",", ".")) || 0;
    const price = Number(parseBrlValue(item.unitPrice) ?? 0);
    return sum + quantity * price;
  }, 0);
  const discount = Number(parseBrlValue(watchedDiscount) ?? 0);

  async function submit(input: CreateQuoteInput) {
    const result = await createQuoteAction(input);
    if (!result.success) {
      setError("root", { message: result.message });
      return;
    }
    router.push(`/orcamentos/${result.quoteId}` as Route);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-6" noValidate>
      {errors.root?.message ? <p className="rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">{errors.root.message}</p> : null}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div><h2 className="font-medium">Itens</h2><p className="text-xs text-muted-foreground">Valores do catálogo são copiados como snapshot.</p></div>
          <Button type="button" variant="outline" size="sm" onClick={() => append({ type: "SERVICE", serviceCatalogItemId: "", description: "", quantity: "1", unitPrice: "R$ 0,00" })}>
            <Plus aria-hidden="true" /> Adicionar
          </Button>
        </div>
        {fields.map((field, index) => (
          <div key={field.id} className="grid gap-3 rounded-xl border bg-muted/20 p-4 lg:grid-cols-[130px_1fr_110px_160px_auto]">
            <div className="space-y-2">
              <Label htmlFor={`item-type-${index}`}>Tipo</Label>
              <select id={`item-type-${index}`} className="h-9 w-full rounded-md border bg-background px-3 text-sm" {...register(`items.${index}.type`)}>
                {Object.entries(quoteItemTypeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor={`item-description-${index}`}>Descrição</Label>
              {watchedItems[index]?.type === "SERVICE" && catalog.length ? (
                <select
                  className="mb-2 h-9 w-full rounded-md border bg-background px-3 text-sm"
                  aria-label="Selecionar do catálogo"
                  {...register(`items.${index}.serviceCatalogItemId`, {
                    onChange: (event) => {
                      const selected = catalog.find((item) => item.id === event.target.value);
                      if (selected) {
                        setValue(`items.${index}.description`, selected.name);
                        setValue(`items.${index}.unitPrice`, decimalToBrlInput(selected.defaultPrice.toString()));
                      }
                    },
                  })}
                >
                  <option value="">Item personalizado</option>
                  {catalog.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                </select>
              ) : null}
              <Input id={`item-description-${index}`} placeholder="Descrição do item" {...register(`items.${index}.description`)} />
              {errors.items?.[index]?.description?.message ? <p className="text-xs text-destructive">{errors.items[index]?.description?.message}</p> : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor={`item-quantity-${index}`}>Quantidade</Label>
              <Input id={`item-quantity-${index}`} inputMode="decimal" {...register(`items.${index}.quantity`)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`item-price-${index}`}>Valor unitário</Label>
              <Controller name={`items.${index}.unitPrice`} control={control} render={({ field: priceField }) => (
                <Input {...priceField} id={`item-price-${index}`} inputMode="numeric" onChange={(event) => priceField.onChange(maskBrlInput(event.target.value))} />
              )} />
            </div>
            <Button type="button" variant="ghost" size="icon" className="self-end" disabled={fields.length === 1} onClick={() => remove(index)} aria-label="Remover item">
              <Trash2 aria-hidden="true" />
            </Button>
          </div>
        ))}
        {typeof errors.items?.message === "string" ? <p className="text-sm text-destructive">{errors.items.message}</p> : null}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="valid-until">Validade</Label>
          <Input id="valid-until" type="date" {...register("validUntil")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="discount">Desconto</Label>
          <Controller name="discount" control={control} render={({ field }) => (
            <Input {...field} id="discount" inputMode="numeric" onChange={(event) => field.onChange(maskBrlInput(event.target.value))} />
          )} />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="quote-notes">Observações</Label>
        <textarea id="quote-notes" rows={4} className="w-full rounded-lg border bg-transparent px-3 py-2 text-sm" {...register("notes")} />
      </div>
      <div className="flex flex-col gap-4 rounded-xl border bg-muted/20 p-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="grid grid-cols-3 gap-6 text-sm">
          <div><p className="text-muted-foreground">Subtotal</p><p className="font-medium">{formatBrazilianCurrency(subtotal)}</p></div>
          <div><p className="text-muted-foreground">Desconto</p><p className="font-medium">{formatBrazilianCurrency(discount)}</p></div>
          <div><p className="text-muted-foreground">Total estimado</p><p className="font-semibold">{formatBrazilianCurrency(Math.max(0, subtotal - discount))}</p></div>
        </div>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : <Save aria-hidden="true" />}
          {isSubmitting ? "Criando..." : "Criar orçamento"}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">O cálculo definitivo é refeito e validado no servidor.</p>
    </form>
  );
}
