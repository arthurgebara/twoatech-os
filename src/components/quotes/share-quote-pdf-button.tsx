"use client";

import { LoaderCircle, Share2 } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";

type ShareQuotePdfButtonProps = {
  customerName: string;
  quoteId: string;
  quoteNumber: number;
  version: number;
};

function fileName(number: number, version: number) {
  return `orcamento-${number}-v${version}.pdf`;
}

export function ShareQuotePdfButton({
  customerName,
  quoteId,
  quoteNumber,
  version,
}: ShareQuotePdfButtonProps) {
  const [pdfFile, setPdfFile] = useState<File>();
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function preparePdf() {
      try {
        const response = await fetch(`/api/pdfs/orcamentos/${quoteId}`, {
          cache: "no-store",
          signal: controller.signal,
        });

        if (!response.ok || !response.headers.get("content-type")?.includes("application/pdf")) {
          throw new Error("Falha ao gerar PDF.");
        }

        const blob = await response.blob();
        setPdfFile(
          new File([blob], fileName(quoteNumber, version), {
            type: "application/pdf",
          }),
        );
      } catch (caughtError) {
        if (caughtError instanceof DOMException && caughtError.name === "AbortError") {
          return;
        }
        setError("Não foi possível preparar o PDF para compartilhamento.");
      }
    }

    void preparePdf();
    return () => controller.abort();
  }, [quoteId, quoteNumber, version]);

  async function sharePdf() {
    if (!pdfFile) return;

    const shareData: ShareData = {
      files: [pdfFile],
      title: `Orçamento #${quoteNumber}`,
      text: `Olá, ${customerName}! Segue o orçamento #${quoteNumber} da TwoATech.`,
    };

    if (!navigator.share || !navigator.canShare?.({ files: [pdfFile] })) {
      setError("O compartilhamento de arquivos não é compatível com este navegador. Use “Abrir PDF”.");
      return;
    }

    try {
      await navigator.share(shareData);
      setError("");
    } catch (caughtError) {
      if (caughtError instanceof DOMException && caughtError.name === "AbortError") {
        return;
      }
      setError("Não foi possível abrir o compartilhamento do iPhone.");
    }
  }

  return (
    <div className="space-y-1.5">
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={!pdfFile}
        onClick={sharePdf}
      >
        {pdfFile ? (
          <Share2 aria-hidden="true" />
        ) : (
          <LoaderCircle className="animate-spin" aria-hidden="true" />
        )}
        {pdfFile ? "Compartilhar PDF" : "Preparando PDF..."}
      </Button>
      {error ? (
        <p className="max-w-72 text-xs text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
