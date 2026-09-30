import { Footer } from "@/components/layout/footer";
import { SiteNavbar } from "@/components/layout/site-navbar";
import { readSession } from "@/lib/auth/session";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const session = await readSession();
  return (
    <>
      <SiteNavbar session={session} />
      <main id="main" className="flex-1">
        {children}
      </main>
      <Footer />
    </>
  );
}
