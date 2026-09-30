import { AssistantLauncher } from "@/components/assistant/assistant-launcher";
import { AppNavbar } from "@/components/layout/app-navbar";
import { requireUser } from "@/lib/auth/dal";
import { countUnread } from "@/lib/notifications/service";
import { runHousekeeping } from "@/lib/housekeeping";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  // Expire overdue food and match open NGO requests (throttled to once a minute).
  await runHousekeeping();
  const unread = await countUnread(user.id);
  return (
    <>
      <AppNavbar name={user.name} role={user.role} unread={unread} />
      <main id="main" className="mx-auto w-full max-w-6xl flex-1 px-4 pt-6 pb-28 sm:px-6 sm:pt-10 md:pb-16">
        {children}
      </main>
      <AssistantLauncher role={user.role} />
      <footer className="hidden border-t border-brand-900/8 bg-cream-100 md:block">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5 text-xs text-ink-500">
          <p>© {new Date().getFullYear()} FoodBridge · FoodWasteZero initiative</p>
          <p>
            Need help? <span className="font-medium text-brand-800">support@foodbridge.local</span>
          </p>
        </div>
      </footer>
    </>
  );
}
