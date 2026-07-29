const BRAZIL_TIME_ZONE = "America/Sao_Paulo";

export function formatLongBrazilianDate(date: Date) {
  const formatted = new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    timeZone: BRAZIL_TIME_ZONE,
  }).format(date);

  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

export function formatBrazilianDateTime(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: BRAZIL_TIME_ZONE,
  })
    .format(date)
    .replace(",", " às");
}
