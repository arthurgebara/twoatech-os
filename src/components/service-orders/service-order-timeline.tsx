import {
  CirclePlus,
  ClipboardCheck,
  Clock3,
  MessageSquareText,
  PackageCheck,
  ShieldCheck,
  Stethoscope,
} from "lucide-react";

import { formatBrazilianDateTime } from "@/lib/dates";
import type { ServiceOrderDetail } from "@/repositories/service-order.repository";

type TimelineEvent = ServiceOrderDetail["timeline"][number];

function EventIcon({ type }: { type: TimelineEvent["type"] }) {
  if (type === "ORDEM_CRIADA") {
    return <CirclePlus className="size-4" aria-hidden="true" />;
  }

  if (type === "EQUIPAMENTO_RECEBIDO") {
    return <PackageCheck className="size-4" aria-hidden="true" />;
  }

  if (type === "OBSERVACAO_ADICIONADA") {
    return <MessageSquareText className="size-4" aria-hidden="true" />;
  }

  if (type === "CHECKLIST_ENTRADA_CONCLUIDO") {
    return <ClipboardCheck className="size-4" aria-hidden="true" />;
  }

  if (type === "DIAGNOSTICO_REGISTRADO") {
    return <Stethoscope className="size-4" aria-hidden="true" />;
  }

  return <Clock3 className="size-4" aria-hidden="true" />;
}

export function ServiceOrderTimeline({
  timeline,
}: {
  timeline: ServiceOrderDetail["timeline"];
}) {
  return (
    <div className="space-y-1">
      <div className="mb-5 flex items-center gap-2 rounded-lg border bg-muted/25 px-3 py-2 text-xs text-muted-foreground">
        <ShieldCheck className="size-4 shrink-0" aria-hidden="true" />
        Timeline permanente, exibida do evento mais recente para o mais antigo.
      </div>

      <ol>
        {timeline.map((event, index) => (
          <li key={event.id} className="relative flex gap-4 pb-6 last:pb-0">
            {index < timeline.length - 1 ? (
              <span
                className="absolute top-9 bottom-0 left-[17px] w-px bg-border"
                aria-hidden="true"
              />
            ) : null}
            <span className="relative z-10 flex size-9 shrink-0 items-center justify-center rounded-xl border bg-background text-muted-foreground shadow-xs">
              <EventIcon type={event.type} />
            </span>
            <div className="min-w-0 flex-1 pt-0.5">
              <div className="flex flex-col gap-0.5 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                <p className="text-sm font-medium">{event.title}</p>
                <time
                  dateTime={event.occurredAt.toISOString()}
                  className="shrink-0 text-xs text-muted-foreground"
                >
                  {formatBrazilianDateTime(event.occurredAt)}
                </time>
              </div>
              {event.description ? (
                <p className="mt-1 text-sm leading-6 whitespace-pre-wrap text-muted-foreground">
                  {event.description}
                </p>
              ) : null}
              <p className="mt-2 text-xs text-muted-foreground">
                Responsável: {event.responsibleUser?.name ?? "Sistema"}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
