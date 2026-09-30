import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";
import Link from "next/link";
import { DonorRegisterForm } from "@/components/auth/donor-register-form";
import { NgoRegisterForm } from "@/components/ngo/ngo-forms";
import { VolunteerRegisterForm } from "@/components/volunteer/volunteer-forms";
import { Badge, Card } from "@/components/ui";
import { SELF_REGISTRATION } from "@/lib/auth/roles";

export const metadata: Metadata = { title: "Create account" };

const ROLE_CARDS = [
  {
    role: "donor",
    title: "Donor",
    text: "Restaurant, hotel, shop or household with surplus food to give.",
  },
  {
    role: "ngo",
    title: "NGO",
    text: "Organisation that receives and distributes food. Needs verification.",
  },
  {
    role: "volunteer",
    title: "Volunteer",
    text: "Pick up food from donors and deliver it to NGOs.",
  },
] as const;

export default async function RegisterPage({ searchParams }: PageProps<"/register">) {
  const { role } = await searchParams;

  if (role === "donor") {
    return (
      <AuthShell className="max-w-xl">
        <Link href="/register" className="text-sm font-medium text-ink-500 hover:text-ink-800">
          ← Choose a different account type
        </Link>
        <Card className="mt-4 p-6 sm:p-8">
          <Badge tone="brand">Donor account</Badge>
          <h1 className="mt-3 font-display text-3xl font-semibold text-brand-950">Start donating food</h1>
          <p className="mt-1 text-sm text-ink-500">Takes about a minute. You can donate right after signing up.</p>
          <div className="mt-6">
            <DonorRegisterForm />
          </div>
        </Card>
        <LoginHint />
      </AuthShell>
    );
  }

  if (role === "ngo") {
    return (
      <AuthShell className="max-w-2xl">
        <Link href="/register" className="text-sm font-medium text-ink-500 hover:text-ink-800">
          ← Choose a different account type
        </Link>
        <Card className="mt-4 p-6 sm:p-8">
          <Badge tone="brand">NGO account</Badge>
          <h1 className="mt-3 font-display text-3xl font-semibold text-brand-950">Receive surplus food</h1>
          <p className="mt-1 text-sm text-ink-500">
            Register your organisation. Our team verifies every NGO, usually within one working day. You can browse
            donations meanwhile.
          </p>
          <div className="mt-6">
            <NgoRegisterForm />
          </div>
        </Card>
        <LoginHint />
      </AuthShell>
    );
  }

  if (role === "volunteer") {
    return (
      <AuthShell className="max-w-xl">
        <Link href="/register" className="text-sm font-medium text-ink-500 hover:text-ink-800">
          ← Choose a different account type
        </Link>
        <Card className="mt-4 p-6 sm:p-8">
          <Badge tone="brand">Volunteer account</Badge>
          <h1 className="mt-3 font-display text-3xl font-semibold text-brand-950">Deliver food to people in need</h1>
          <p className="mt-1 text-sm text-ink-500">
            Pick up surplus food from donors and bring it to NGOs. Our team verifies every volunteer, usually within one
            working day.
          </p>
          <div className="mt-6">
            <VolunteerRegisterForm />
          </div>
        </Card>
        <LoginHint />
      </AuthShell>
    );
  }

  return (
    <AuthShell className="max-w-3xl">
      <h1 className="font-display text-3xl font-semibold text-brand-950 sm:text-4xl">Create your FoodBridge account</h1>
      <p className="mt-1 text-ink-500">Choose how you want to help. Each role has its own portal.</p>

      <ul className="mt-8 grid gap-4 sm:grid-cols-3">
        {ROLE_CARDS.map((c) => {
          const open = SELF_REGISTRATION[c.role].open;
          return (
            <li key={c.role}>
              <Link
                href={`/register?role=${c.role}`}
                className="group flex h-full flex-col rounded-card border border-cream-200 bg-white p-5 shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-brand-500 hover:shadow-raised"
              >
                <div className="flex items-center justify-between gap-2">
                  <h2 className="font-display text-xl font-semibold text-brand-950">{c.title}</h2>
                  {open ? <Badge tone="brand">Open</Badge> : <Badge>Coming soon</Badge>}
                </div>
                <p className="mt-2 flex-1 text-sm text-ink-500">{c.text}</p>
                <span className="mt-4 text-sm font-semibold text-brand-700 group-hover:underline">
                  {open ? "Continue →" : "Learn more →"}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>

      <LoginHint />
    </AuthShell>
  );
}

function LoginHint() {
  return (
    <p className="mt-6 text-center text-sm text-ink-600">
      Already have an account?{" "}
      <Link href="/login" className="font-semibold text-brand-700 hover:underline">
        Log in
      </Link>
    </p>
  );
}
