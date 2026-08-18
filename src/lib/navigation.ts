import {
  FileClock,
  FileText,
  Gauge,
  Laptop,
  ListChecks,
  Users,
  Wrench,
} from "lucide-react";

export const navigationItems = [
  { label: "Dashboard", href: "/dashboard", icon: Gauge },
  { label: "Clientes", href: "/clientes", icon: Users },
  { label: "Equipamentos", href: "/equipamentos", icon: Laptop },
  { label: "Orçamentos", href: "/orcamentos", icon: FileText },
  { label: "Ordens de Serviço", href: "/ordens-de-servico", icon: Wrench },
  { label: "Tabela de Serviços", href: "/servicos", icon: ListChecks },
  { label: "Histórico", href: "/historico", icon: FileClock },
] as const;
