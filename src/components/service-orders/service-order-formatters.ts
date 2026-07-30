export function formatServiceOrderNumber(number: number) {
  return `OS #${String(number).padStart(6, "0")}`;
}
