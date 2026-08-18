"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle, Plus, Save, Trash2, UserPlus, LaptopMinimal } from "lucide-react";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Controller, useFieldArray, useForm, useWatch } from "react-hook-form";

import { createQuoteAction } from "@/actions/quote.actions";
import { CustomerForm } from "@/components/customers/customer-form";
import { formatCpfCnpj } from "@/components/customers/customer-formatters";
import { EquipmentForm } from "@/components/equipment/equipment-form";
import { formatEquipmentName } from "@/components/equipment/equipment-formatters";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { decimalToBrlInput, formatBrazilianCurrency, maskBrlInput } from "@/lib/currency";
import type { CustomerOption } from "@/repositories/customer.repository";
import type { EquipmentOption } from "@/repositories/equipment.repository";
import type { CustomerFormInput } from "@/schemas/customer.schema";
import type { EquipmentFormInput } from "@/schemas/equipment.schema";
import { parseBrlValue } from "@/schemas/service-catalog.schema";
import { createQuoteSchema, quoteItemTypeLabels, type CreateQuoteInput } from "@/schemas/quote.schema";

type CatalogOption = { id: string; name: string; description: string | null; defaultPrice: string };

const textareaClassName = "w-full resize-y rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive dark:bg-input/30";

export function QuoteForm({
  idempotencyKey,
  catalog,
  customers: initialCustomers,
  equipment: initialEquipment,
}: {
  idempotencyKey: string;
  catalog: CatalogOption[];
  customers: CustomerOption[];
  equipment: EquipmentOption[];
}) {
  const router = useRouter();
  const [customers, setCustomers] = useState(initialCustomers);
  const [equipment, setEquipment] = useState(initialEquipment);
  const [customerSheetOpen, setCustomerSheetOpen] = useState(false);
  const [equipmentSheetOpen, setEquipmentSheetOpen] = useState(false);
  const { control, register, handleSubmit, setError, setValue, formState: { errors, isSubmitting } } = useForm<CreateQuoteInput>({
    resolver: zodResolver(createQuoteSchema),
    defaultValues: {
      customerId: "",
      equipmentId: "",
      idempotencyKey,
      reportedProblem: "",
      receivedAccessories: "",
      generalNotes: "",
      validUntil: "",
      notes: "",
      discount: "R$ 0,00",
      items: [{ type: "SERVICE", serviceCatalogItemId: "", description: "", quantity: "1", unitPrice: "R$ 0,00" }],
    },
  });
  const { fields, append, remove } = useFieldArray({ control, name: "items" });
  const selectedCustomerId = useWatch({ control, name: "customerId" });
  const watchedItems = useWatch({ control, name: "items" });
  const watchedDiscount = useWatch({ control, name: "discount" });
  const customerEquipment = equipment.filter((item) => item.customerId === selectedCustomerId && item.isActive);
  const subtotal = watchedItems.reduce((sum, item) => {
    const quantity = Number(item.quantity.replace(",", ".")) || 0;
    return sum + quantity * Number(parseBrlValue(item.unitPrice) ?? 0);
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

  function customerCreated(customerId: string, values: CustomerFormInput) {
    setCustomers((current) => [...current, { id: customerId, name: values.name.trim(), document: values.document.replace(/\D/g, "") || null, isActive: true }]);
    setValue("customerId", customerId, { shouldValidate: true });
    setValue("equipmentId", "");
    setCustomerSheetOpen(false);
  }

  function equipmentCreated(equipmentId: string, values: EquipmentFormInput) {
    setEquipment((current) => [...current, {
      id: equipmentId,
      customerId: values.customerId,
      type: values.type,
      brand: values.brand.trim() || null,
      model: values.model.trim() || null,
      serialNumber: values.serialNumber.trim() || null,
      isActive: true,
      customer: { isActive: true },
    }]);
    setValue("equipmentId", equipmentId, { shouldValidate: true });
    setEquipmentSheetOpen(false);
  }

  return (
    <>
      <form onSubmit={handleSubmit(submit)} className="space-y-7" noValidate>
        {errors.root?.message ? <p className="rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">{errors.root.message}</p> : null}

        <section className="space-y-4">
          <div><h2 className="font-medium">1. Cliente e equipamento</h2><p className="text-xs text-muted-foreground">Selecione um cadastro existente ou crie sem sair do orçamento.</p></div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2"><Label htmlFor="quote-customer">Cliente</Label><Button type="button" variant="ghost" size="sm" onClick={() => setCustomerSheetOpen(true)}><UserPlus aria-hidden="true" /> Novo</Button></div>
              <select id="quote-customer" className="h-9 w-full rounded-md border bg-background px-3 text-sm" aria-invalid={Boolean(errors.customerId)} {...register("customerId", { onChange: () => setValue("equipmentId", "") })}>
                <option value="">Selecione o cliente</option>
                {customers.filter((customer) => customer.isActive).map((customer) => <option key={customer.id} value={customer.id}>{customer.name} · {formatCpfCnpj(customer.document)}</option>)}
              </select>
              {errors.customerId?.message ? <p className="text-xs text-destructive">{errors.customerId.message}</p> : null}
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2"><Label htmlFor="quote-equipment">Equipamento</Label><Button type="button" variant="ghost" size="sm" disabled={!selectedCustomerId} onClick={() => setEquipmentSheetOpen(true)}><LaptopMinimal aria-hidden="true" /> Novo</Button></div>
              <select id="quote-equipment" className="h-9 w-full rounded-md border bg-background px-3 text-sm" disabled={!selectedCustomerId} aria-invalid={Boolean(errors.equipmentId)} {...register("equipmentId")}>
                <option value="">{selectedCustomerId ? "Selecione o equipamento" : "Selecione primeiro o cliente"}</option>
                {customerEquipment.map((item) => <option key={item.id} value={item.id}>{formatEquipmentName(item)}{item.serialNumber ? ` · ${item.serialNumber}` : ""}</option>)}
              </select>
              {errors.equipmentId?.message ? <p className="text-xs text-destructive">{errors.equipmentId.message}</p> : null}
            </div>
          </div>
        </section>

        <section className="space-y-4 border-t pt-6">
          <div><h2 className="font-medium">2. Dados do atendimento</h2><p className="text-xs text-muted-foreground">Essas informações acompanharão a ordem criada após a aprovação.</p></div>
          <div className="space-y-2"><Label htmlFor="reported-problem">Problema ou necessidade relatada</Label><textarea id="reported-problem" rows={4} className={textareaClassName} placeholder="Descreva o que o cliente precisa ou o defeito informado" {...register("reportedProblem")} />{errors.reportedProblem?.message ? <p className="text-xs text-destructive">{errors.reportedProblem.message}</p> : null}</div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2"><Label htmlFor="received-accessories">Acessórios previstos</Label><textarea id="received-accessories" rows={3} className={textareaClassName} placeholder="Carregador, fonte, cabo..." {...register("receivedAccessories")} /></div>
            <div className="space-y-2"><Label htmlFor="general-notes">Observações internas</Label><textarea id="general-notes" rows={3} className={textareaClassName} {...register("generalNotes")} /></div>
          </div>
        </section>

        <section className="space-y-3 border-t pt-6">
          <div className="flex items-center justify-between gap-3"><div><h2 className="font-medium">3. Itens do orçamento</h2><p className="text-xs text-muted-foreground">Valores do catálogo são copiados como snapshot.</p></div><Button type="button" variant="outline" size="sm" onClick={() => append({ type: "SERVICE", serviceCatalogItemId: "", description: "", quantity: "1", unitPrice: "R$ 0,00" })}><Plus aria-hidden="true" /> Adicionar</Button></div>
          {fields.map((field, index) => (
            <div key={field.id} className="grid gap-3 rounded-xl border bg-muted/20 p-4 lg:grid-cols-[130px_1fr_110px_160px_auto]">
              <div className="space-y-2"><Label htmlFor={`item-type-${index}`}>Tipo</Label><select id={`item-type-${index}`} className="h-9 w-full rounded-md border bg-background px-3 text-sm" {...register(`items.${index}.type`)}>{Object.entries(quoteItemTypeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>
              <div className="space-y-2"><Label htmlFor={`item-description-${index}`}>Descrição</Label>{watchedItems[index]?.type === "SERVICE" && catalog.length ? <select className="mb-2 h-9 w-full rounded-md border bg-background px-3 text-sm" aria-label="Selecionar do catálogo" {...register(`items.${index}.serviceCatalogItemId`, { onChange: (event) => { const selected = catalog.find((item) => item.id === event.target.value); if (selected) { setValue(`items.${index}.description`, selected.name); setValue(`items.${index}.unitPrice`, decimalToBrlInput(selected.defaultPrice)); } } })}><option value="">Item personalizado</option>{catalog.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select> : null}<Input id={`item-description-${index}`} placeholder="Descrição do item" {...register(`items.${index}.description`)} />{errors.items?.[index]?.description?.message ? <p className="text-xs text-destructive">{errors.items[index]?.description?.message}</p> : null}</div>
              <div className="space-y-2"><Label htmlFor={`item-quantity-${index}`}>Quantidade</Label><Input id={`item-quantity-${index}`} inputMode="decimal" {...register(`items.${index}.quantity`)} /></div>
              <div className="space-y-2"><Label htmlFor={`item-price-${index}`}>Valor unitário</Label><Controller name={`items.${index}.unitPrice`} control={control} render={({ field: priceField }) => <Input {...priceField} id={`item-price-${index}`} inputMode="numeric" onChange={(event) => priceField.onChange(maskBrlInput(event.target.value))} />} /></div>
              <Button type="button" variant="ghost" size="icon" className="self-end" disabled={fields.length === 1} onClick={() => remove(index)} aria-label="Remover item"><Trash2 aria-hidden="true" /></Button>
            </div>
          ))}
        </section>

        <div className="grid gap-4 border-t pt-6 md:grid-cols-2"><div className="space-y-2"><Label htmlFor="valid-until">Validade</Label><Input id="valid-until" type="date" {...register("validUntil")} /></div><div className="space-y-2"><Label htmlFor="discount">Desconto</Label><Controller name="discount" control={control} render={({ field }) => <Input {...field} id="discount" inputMode="numeric" onChange={(event) => field.onChange(maskBrlInput(event.target.value))} />} /></div></div>
        <div className="space-y-2"><Label htmlFor="quote-notes">Observações para o cliente</Label><textarea id="quote-notes" rows={4} className={textareaClassName} {...register("notes")} /></div>
        <div className="flex flex-col gap-4 rounded-xl border bg-muted/20 p-4 sm:flex-row sm:items-end sm:justify-between"><div className="grid grid-cols-3 gap-6 text-sm"><div><p className="text-muted-foreground">Subtotal</p><p className="font-medium">{formatBrazilianCurrency(subtotal)}</p></div><div><p className="text-muted-foreground">Desconto</p><p className="font-medium">{formatBrazilianCurrency(discount)}</p></div><div><p className="text-muted-foreground">Total</p><p className="font-semibold">{formatBrazilianCurrency(Math.max(0, subtotal - discount))}</p></div></div><Button type="submit" disabled={isSubmitting}>{isSubmitting ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : <Save aria-hidden="true" />}{isSubmitting ? "Criando..." : "Criar orçamento"}</Button></div>
        <p className="text-xs text-muted-foreground">A ordem de serviço será criada somente quando este orçamento for aprovado.</p>
      </form>

      <Sheet open={customerSheetOpen} onOpenChange={setCustomerSheetOpen}><SheetContent className="w-full overflow-y-auto sm:max-w-xl"><SheetHeader><SheetTitle>Novo cliente</SheetTitle><SheetDescription>Cadastre e continue o orçamento sem perder os itens.</SheetDescription></SheetHeader><div className="p-4 pt-0"><CustomerForm mode="create" embedded onCreated={customerCreated} /></div></SheetContent></Sheet>
      <Sheet open={equipmentSheetOpen} onOpenChange={setEquipmentSheetOpen}><SheetContent className="w-full overflow-y-auto sm:max-w-xl"><SheetHeader><SheetTitle>Novo equipamento</SheetTitle><SheetDescription>O equipamento será vinculado ao cliente selecionado.</SheetDescription></SheetHeader><div className="p-4 pt-0"><EquipmentForm mode="create" embedded customerOptions={customers} defaultValues={{ customerId: selectedCustomerId, type: "NOTEBOOK", brand: "", model: "", serialNumber: "", color: "", specifications: "", notes: "" }} onCreated={equipmentCreated} /></div></SheetContent></Sheet>
    </>
  );
}
