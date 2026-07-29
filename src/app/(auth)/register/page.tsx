"use client";

import { useActionState } from "react";
import Link from "next/link";
import { registerAction } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";

export default function RegisterPage() {
  const [state, formAction, isPending] = useActionState(registerAction, {});

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <div className="text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Criar conta</h1>
        <p className="mt-1 text-sm text-muted">Comece a registrar sua vida cultural.</p>
      </div>

      <Field label="Nome" htmlFor="name">
        <Input id="name" name="name" type="text" autoComplete="name" required />
      </Field>

      <Field label="Nome de usuário" htmlFor="username">
        <Input id="username" name="username" type="text" autoComplete="username" placeholder="arthur" required />
      </Field>

      <Field label="E-mail" htmlFor="email">
        <Input id="email" name="email" type="email" autoComplete="email" required />
      </Field>

      <Field label="Senha" htmlFor="password">
        <Input id="password" name="password" type="password" autoComplete="new-password" required />
      </Field>

      {state.error && <p className="text-sm text-danger">{state.error}</p>}

      <Button type="submit" size="lg" loading={isPending} className="w-full">
        Criar conta
      </Button>

      <p className="text-center text-sm text-muted">
        Já tem uma conta?{" "}
        <Link href="/login" className="text-primary hover:underline">
          Entrar
        </Link>
      </p>
    </form>
  );
}
