import { Footer } from "@/components/layout/footer";
import { SiteNavbar } from "@/components/layout/site-navbar";
import { readSession } from "@/lib/auth/session";
import { getLang } from "@/lib/i18n-server";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const [session, lang] = await Promise.all([readSession(), getLang()]);
  return (
    <div className="flex flex-1 flex-col bg-night-950">
      <SiteNavbar session={session} lang={lang} />
      <main id="main" className="flex-1">
        {children}
      </main>
      <Footer lang={lang} />
    </div>
  );
}
