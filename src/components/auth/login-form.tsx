"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, LoaderCircle, LockKeyhole, Mail } from "lucide-react";
import { getCsrfToken } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginSchema, type LoginInput } from "@/schemas/auth.schema";

export function LoginForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string>();
  const [isNavigating, setIsNavigating] = useState(false);
  const [csrfToken, setCsrfToken] = useState<string>();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  useEffect(() => {
    let ignore = false;

    void getCsrfToken().then((token) => {
      if (!ignore) {
        setCsrfToken(token);
      }
    });

    return () => {
      ignore = true;
    };
  }, []);

  async function onSubmit(data: LoginInput) {
    setFormError(undefined);

    try {
      const preparedCsrfToken = csrfToken ?? (await getCsrfToken());

      if (!preparedCsrfToken) {
        throw new Error("Não foi possível preparar a autenticação.");
      }

      setCsrfToken(preparedCsrfToken);

      const response = await fetch("/api/auth/callback/credentials", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          csrfToken: preparedCsrfToken,
          callbackUrl: `${window.location.origin}/dashboard`,
          json: "true",
          email: data.email,
          password: data.password,
        }),
      });
      const result = (await response.json()) as { url?: string };
      const authError = result.url
        ? new URL(result.url, window.location.origin).searchParams.get("error")
        : "CredentialsSignin";

      if (!response.ok || authError) {
        void getCsrfToken().then(setCsrfToken);
        setFormError("E-mail ou senha incorretos. Tente novamente.");
        return;
      }

      setIsNavigating(true);
      router.replace("/dashboard");
    } catch {
      setCsrfToken(undefined);
      setFormError("Não foi possível entrar agora. Tente novamente em instantes.");
    }
  }

  const isPending = isSubmitting || isNavigating;

  return (
    <form className="space-y-5" onSubmit={handleSubmit(onSubmit)} noValidate>
      <div className="space-y-2">
        <Label htmlFor="email">E-mail</Label>
        <div className="relative">
          <Mail
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            id="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="voce@twoatech.com.br"
            className="h-11 pl-10"
            aria-invalid={Boolean(errors.email)}
            disabled={isNavigating}
            {...register("email")}
          />
        </div>
        {errors.email && (
          <p className="text-xs text-destructive">{errors.email.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Senha</Label>
        <div className="relative">
          <LockKeyhole
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder="Digite sua senha"
            className="h-11 pr-11 pl-10"
            aria-invalid={Boolean(errors.password)}
            disabled={isNavigating}
            {...register("password")}
          />
          <button
            type="button"
            className="absolute top-1/2 right-1.5 flex size-8 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
            aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
            disabled={isNavigating}
            onClick={() => setShowPassword((visible) => !visible)}
          >
            {showPassword ? (
              <EyeOff className="size-4" aria-hidden="true" />
            ) : (
              <Eye className="size-4" aria-hidden="true" />
            )}
          </button>
        </div>
        {errors.password && (
          <p className="text-xs text-destructive">{errors.password.message}</p>
        )}
      </div>

      {formError && (
        <div
          role="alert"
          className="rounded-lg border border-destructive/20 bg-destructive/8 px-3 py-2.5 text-sm text-destructive"
        >
          {formError}
        </div>
      )}

      <Button className="h-11 w-full" type="submit" disabled={isPending}>
        {isPending && (
          <LoaderCircle className="animate-spin" aria-hidden="true" />
        )}
        {isNavigating
          ? "Abrindo painel..."
          : isSubmitting
            ? "Entrando..."
            : "Entrar no sistema"}
      </Button>
    </form>
  );
}
