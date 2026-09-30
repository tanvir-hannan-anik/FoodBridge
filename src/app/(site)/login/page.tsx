import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";
import Link from "next/link";
import { LoginForm } from "@/components/auth/login-form";
import { Card } from "@/components/ui";

export const metadata: Metadata = { title: "Log in" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { next } = await searchParams;
  return (
    <AuthShell className="max-w-md">
      <Card className="p-6 sm:p-8">
        <h1 className="font-display text-3xl font-semibold text-brand-950">Welcome back</h1>
        <p className="mt-1 text-sm text-ink-500">Log in to your FoodBridge account.</p>
        <div className="mt-6">
          <LoginForm next={typeof next === "string" ? next : undefined} />
        </div>
      </Card>
      <p className="mt-6 text-center text-sm text-ink-600">
        New to FoodBridge?{" "}
        <Link href="/register" className="font-semibold text-brand-700 hover:underline">
          Create an account
        </Link>
      </p>
    </AuthShell>
  );
}
