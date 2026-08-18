"use client";

import { CheckCircle2, ChevronRight, FileText, Inbox, Paperclip, Wrench, X } from "lucide-react";
import { useState } from "react";

import { completeQuickstartAction } from "@/actions/quickstart.actions";
import { Button } from "@/components/ui/button";

const steps = [
  { icon: Inbox, title: "Receba e organize", text: "Solicitações enviadas pela nova home chegam na caixa de entrada para você entrar em contato." },
  { icon: FileText, title: "Comece pelo orçamento", text: "Cadastre cliente e equipamento dentro do atendimento, monte a proposta e compartilhe o PDF." },
  { icon: Wrench, title: "Siga a ordem guiada", text: "Após a aprovação, a OS é criada e libera checklist, diagnóstico, execução, saída e entrega na sequência correta." },
  { icon: Paperclip, title: "Registre evidências", text: "Anexe fotos e PDFs nas checklists de entrada e saída. Os arquivos ficam privados." },
] as const;

export function QuickstartGuide({ show }: { show: boolean }) {
  const [open, setOpen] = useState(show); const [step, setStep] = useState(0); const [saving, setSaving] = useState(false);
  if (!open) return null; const current = steps[step]; const Icon = current.icon;
  async function finish() { setSaving(true); const result = await completeQuickstartAction(); if (result.success) setOpen(false); setSaving(false); }
  return <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/55 p-3 backdrop-blur-sm sm:items-center" role="presentation"><section role="dialog" aria-modal="true" aria-labelledby="quickstart-title" className="w-full max-w-lg rounded-2xl border bg-card p-6 shadow-2xl sm:p-8"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-semibold tracking-widest text-primary uppercase">Guia rápido · {step + 1} de {steps.length}</p><h2 id="quickstart-title" className="mt-2 text-2xl font-semibold">Bem-vindo ao TwoATech OS</h2></div><Button type="button" variant="ghost" size="icon" aria-label="Fechar guia" onClick={() => setOpen(false)}><X /></Button></div><div className="my-8"><span className="mb-5 flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground"><Icon className="size-6" /></span><h3 className="text-xl font-semibold">{current.title}</h3><p className="mt-3 leading-7 text-muted-foreground">{current.text}</p></div><div className="mb-6 flex gap-2" aria-hidden="true">{steps.map((item,index) => <span key={item.title} className={`h-1.5 flex-1 rounded-full ${index <= step ? "bg-primary" : "bg-muted"}`} />)}</div><div className="flex justify-between gap-3"><Button type="button" variant="ghost" disabled={step === 0} onClick={() => setStep((value) => value - 1)}>Voltar</Button>{step < steps.length - 1 ? <Button type="button" onClick={() => setStep((value) => value + 1)}>Próximo<ChevronRight /></Button> : <Button type="button" disabled={saving} onClick={() => void finish()}><CheckCircle2 />{saving ? "Salvando..." : "Começar a usar"}</Button>}</div></section></div>;
}
