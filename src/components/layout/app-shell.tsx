"use client";

import { LogOut, Menu, Search } from "lucide-react";
import { signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { Brand } from "@/components/brand";
import { ThemeToggle } from "@/components/theme-toggle";
import { QuickstartGuide } from "@/components/layout/quickstart-guide";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  navigationItems,
} from "@/lib/navigation";
import { cn } from "@/lib/utils";

type AppShellProps = {
  children: React.ReactNode;
  user: {
    name: string;
    email: string;
    image: string | null;
    hasCompletedQuickstart: boolean;
  };
};

function getInitials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function Navigation({
  pathname,
  onNavigate,
}: {
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <nav aria-label="Navegação principal" className="flex flex-1 flex-col gap-1">
      {navigationItems.map((item) => {
        const isActive =
          pathname === item.href ||
          (item.href !== "/dashboard" && pathname.startsWith(`${item.href}/`));
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "group flex h-9 items-center gap-3 rounded-lg px-3 text-sm text-sidebar-foreground/65 transition-all duration-200 hover:translate-x-0.5 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              isActive &&
                "bg-sidebar-primary font-semibold text-sidebar-primary-foreground shadow-sm ring-1 ring-sidebar-primary/30",
            )}
          >
            <Icon
              className={cn(
                "size-4 text-sidebar-foreground/45 transition-all duration-200 group-hover:scale-110 group-hover:text-sidebar-accent-foreground",
                isActive && "text-sidebar-primary-foreground",
              )}
              aria-hidden="true"
            />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function UserSummary({ user }: Pick<AppShellProps, "user">) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <Avatar className="size-8">
        <AvatarImage src={user.image ?? undefined} alt="" />
        <AvatarFallback className="text-[11px] font-semibold">
          {getInitials(user.name)}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-medium">{user.name}</p>
        <p className="truncate text-[11px] text-muted-foreground">
          {user.email}
        </p>
      </div>
    </div>
  );
}

function SidebarContent({
  pathname,
  user,
  onNavigate,
}: AppShellProps & { pathname: string; onNavigate?: () => void }) {
  return (
    <>
      <div className="px-4 py-5">
        <Brand />
      </div>
      <Separator />
      <div className="flex flex-1 flex-col overflow-y-auto px-3 py-4">
        <p className="mb-2 px-3 text-[10px] font-semibold tracking-[0.16em] text-muted-foreground uppercase">
          Operação
        </p>
        <Navigation pathname={pathname} onNavigate={onNavigate} />

      </div>

      <div className="border-t p-3">
        <div className="flex items-center gap-1 rounded-xl p-1.5">
          <div className="min-w-0 flex-1">
            <UserSummary user={user} />
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Sair do sistema"
            onClick={() => signOut({ callbackUrl: "/login" })}
          >
            <LogOut aria-hidden="true" />
          </Button>
        </div>
      </div>
    </>
  );
}

export function AppShell({ children, user }: AppShellProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const mobileItems = navigationItems.filter((item) =>
    ["/dashboard", "/clientes", "/equipamentos", "/ordens-de-servico"].includes(
      item.href,
    ),
  );

  return (
    <div className="min-h-dvh bg-muted/20">
      <QuickstartGuide show={!user.hasCompletedQuickstart} />
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r bg-sidebar text-sidebar-foreground md:flex">
        <SidebarContent pathname={pathname} user={user}>
          {children}
        </SidebarContent>
      </aside>

      <div className="md:pl-64">
        <header className="app-header sticky top-0 z-20 flex items-center justify-between border-b bg-background/90 px-4 backdrop-blur-xl sm:px-6">
          <div className="flex items-center gap-2 md:hidden">
            <Brand compact />
          </div>

          <button
            type="button"
            className="hidden h-8 w-full max-w-sm items-center gap-2 rounded-lg border bg-muted/30 px-3 text-left text-xs text-muted-foreground transition-colors hover:bg-muted md:flex"
            aria-label="Buscar no sistema"
          >
            <Search className="size-3.5" aria-hidden="true" />
            Buscar clientes, equipamentos ou ordens...
            <kbd className="ml-auto rounded border bg-background px-1.5 py-0.5 font-mono text-[10px]">
              ⌘ K
            </kbd>
          </button>

          <div className="flex items-center gap-1">
            <ThemeToggle />
            <div className="ml-1 hidden sm:block md:hidden">
              <UserSummary user={user} />
            </div>
          </div>
        </header>

        <main className="app-main mx-auto w-full max-w-[1500px] p-4 sm:p-6 lg:p-8">
          <div key={pathname} className="page-transition">
            {children}
          </div>
        </main>
      </div>

      <nav
        aria-label="Navegação móvel"
        className="app-bottom-nav fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t bg-background/95 pt-1.5 shadow-[0_-8px_24px_-20px_rgba(0,0,0,0.45)] backdrop-blur-xl md:hidden"
      >
        {mobileItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" &&
              pathname.startsWith(`${item.href}/`));
          const Icon = item.icon;
          const mobileLabel =
            item.href === "/dashboard"
              ? "Início"
              : item.href === "/equipamentos"
                ? "Equip."
                : item.href === "/ordens-de-servico"
                  ? "Ordens"
                  : item.label;

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-xl px-1 text-[10px] font-medium text-muted-foreground transition-colors",
                isActive && "bg-muted text-foreground",
              )}
            >
              <Icon
                className={cn("size-5", isActive && "text-primary")}
                aria-hidden="true"
              />
              <span className="max-w-full truncate">{mobileLabel}</span>
            </Link>
          );
        })}

        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetTrigger
            render={
              <button
                type="button"
                className="flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-xl px-1 text-[10px] font-medium text-muted-foreground"
                aria-label="Abrir todos os módulos"
              />
            }
          >
            <Menu className="size-5" aria-hidden="true" />
            <span>Mais</span>
          </SheetTrigger>
          <SheetContent side="left" className="safe-sheet w-[min(86vw,320px)] p-0">
            <SheetHeader className="sr-only">
              <SheetTitle>Todos os módulos</SheetTitle>
              <SheetDescription>Navegação do TwoATech OS</SheetDescription>
            </SheetHeader>
            <SidebarContent
              pathname={pathname}
              user={user}
              onNavigate={() => setMobileMenuOpen(false)}
            >
              {children}
            </SidebarContent>
          </SheetContent>
        </Sheet>
      </nav>
    </div>
  );
}
