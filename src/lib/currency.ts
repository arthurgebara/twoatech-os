export function formatBrazilianCurrency(value: number | bigint | string) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(value));
}

export function maskBrlInput(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 12);
  const amount = Number(digits || "0") / 100;
  return formatBrazilianCurrency(amount);
}

export function decimalToBrlInput(value: string) {
  const amount = Number(value);
  return Number.isFinite(amount)
    ? formatBrazilianCurrency(amount)
    : formatBrazilianCurrency(0);
}
