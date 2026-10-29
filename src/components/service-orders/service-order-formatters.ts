export function formatServiceOrderNumber(number: number, isIntake = false) {
  return `${isIntake ? "Atendimento" : "OS"} #${String(number).padStart(6, "0")}`;
}
