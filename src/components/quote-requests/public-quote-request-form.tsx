"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, LoaderCircle, Send } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { createPublicQuoteRequestAction } from "@/actions/quote-request.actions";
import { maskPhone } from "@/components/customers/customer-formatters";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { publicEquipmentTypeOptions, quoteRequestFormSchema, type QuoteRequestFormInput } from "@/schemas/quote-request.schema";

export function PublicQuoteRequestForm() {
  const [success, setSuccess] = useState("");
  const { register, handleSubmit, reset, setError, formState: { errors, isSubmitting } } = useForm<QuoteRequestFormInput>({ resolver: zodResolver(quoteRequestFormSchema), defaultValues: { name: "", phone: "", email: "", equipmentType: "NOTEBOOK", equipmentDescription: "", reportedProblem: "", website: "" } });
  async function submit(values: QuoteRequestFormInput) {
    setSuccess("");
    const result = await createPublicQuoteRequestAction(values);
    if (!result.success) { setError("root", { message: result.message }); return; }
    setSuccess(result.message); reset();
  }
  if (success) return <div className="flex min-h-80 flex-col items-center justify-center text-center"><span className="mb-4 flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground"><CheckCircle2 className="size-7" /></span><h2 className="text-xl font-semibold">Tudo certo!</h2><p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">{success}</p><Button type="button" variant="outline" className="mt-6" onClick={() => setSuccess("")}>Enviar outra solicitação</Button></div>;
  return <form onSubmit={handleSubmit(submit)} className="space-y-4" noValidate>
    {errors.root?.message ? <p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{errors.root.message}</p> : null}
    <div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label htmlFor="request-name">Nome</Label><Input id="request-name" autoComplete="name" {...register("name")} />{errors.name?.message ? <p className="text-xs text-destructive">{errors.name.message}</p> : null}</div><div className="space-y-2"><Label htmlFor="request-phone">WhatsApp/telefone</Label><Input id="request-phone" inputMode="tel" autoComplete="tel" {...register("phone", { onChange: (event) => { event.target.value = maskPhone(event.target.value); } })} />{errors.phone?.message ? <p className="text-xs text-destructive">{errors.phone.message}</p> : null}</div></div>
    <div className="space-y-2"><Label htmlFor="request-email">E-mail <span className="text-muted-foreground">(opcional)</span></Label><Input id="request-email" type="email" autoComplete="email" {...register("email")} />{errors.email?.message ? <p className="text-xs text-destructive">{errors.email.message}</p> : null}</div>
    <div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label htmlFor="request-type">Tipo</Label><select id="request-type" className="h-9 w-full rounded-lg border bg-background px-3 text-sm" {...register("equipmentType")}>{publicEquipmentTypeOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></div><div className="space-y-2"><Label htmlFor="request-equipment">Marca e modelo <span className="text-muted-foreground">(opcional)</span></Label><Input id="request-equipment" placeholder="Ex.: Dell Inspiron" {...register("equipmentDescription")} /></div></div>
    <div className="space-y-2"><Label htmlFor="request-problem">Como podemos ajudar?</Label><textarea id="request-problem" rows={5} className="w-full rounded-lg border bg-transparent px-3 py-2 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30" placeholder="Descreva o defeito, serviço ou melhoria que você precisa" {...register("reportedProblem")} />{errors.reportedProblem?.message ? <p className="text-xs text-destructive">{errors.reportedProblem.message}</p> : null}</div>
    <div className="absolute -left-[10000px]" aria-hidden="true"><Label htmlFor="request-website">Website</Label><Input id="request-website" tabIndex={-1} autoComplete="off" {...register("website")} /></div>
    <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>{isSubmitting ? <LoaderCircle className="animate-spin" /> : <Send />}{isSubmitting ? "Enviando..." : "Enviar solicitação"}</Button>
    <p className="text-center text-xs text-muted-foreground">Ao enviar, você autoriza o contato da TwoATech sobre esta solicitação.</p>
  </form>;
}
