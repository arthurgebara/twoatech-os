import {
  ClipboardCheck,
  FileClock,
  FileText,
  Gauge,
  Laptop,
  ListChecks,
  Settings2,
  Users,
  Wrench,
} from "lucide-react";

export const navigationItems = [
  { label: "Dashboard", href: "/dashboard", icon: Gauge },
  { label: "Clientes", href: "/clientes", icon: Users },
  { label: "Equipamentos", href: "/equipamentos", icon: Laptop },
  { label: "Ordens de Serviço", href: "/ordens-de-servico", icon: Wrench },
  { label: "Orçamentos", href: "/orcamentos", icon: FileText },
  { label: "Checklists", href: "/checklists", icon: ClipboardCheck },
  { label: "Tabela de Serviços", href: "/servicos", icon: ListChecks },
  { label: "Histórico", href: "/historico", icon: FileClock },
] as const;

export const secondaryNavigationItems = [
  { label: "Configurações", href: "/configuracoes", icon: Settings2 },
] as const;
