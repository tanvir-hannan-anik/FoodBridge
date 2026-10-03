import type { Metadata, Viewport } from "next";
import { Fraunces, Hind_Siliguri, Noto_Serif_Bengali, Plus_Jakarta_Sans } from "next/font/google";
import { I18nProvider } from "@/components/i18n-provider";
import { getI18n } from "@/lib/i18n-server";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  display: "swap",
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  axes: ["SOFT", "opsz"],
  display: "swap",
});

// Bangla glyphs fall through to these (see --font-sans / --font-display). Not preloaded: the browser
// fetches them only when Bangla text is on the page (unicode-range).
const hind = Hind_Siliguri({
  variable: "--font-hind",
  subsets: ["bengali"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  preload: false,
});

const serifBn = Noto_Serif_Bengali({
  variable: "--font-serif-bn",
  subsets: ["bengali"],
  display: "swap",
  preload: false,
});

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return {
    title: {
      default: t("FoodBridge — Share surplus food, feed people"),
      template: "%s · FoodBridge",
    },
    description: t(
      "FoodBridge connects restaurants, hotels, shops and households with NGOs and volunteers to rescue surplus food and deliver it to people in need.",
    ),
  };
}

export const viewport: Viewport = {
  themeColor: "#060e0a",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const { lang, t } = await getI18n();
  return (
    <html lang={lang} className={`${jakarta.variable} ${fraunces.variable} ${hind.variable} ${serifBn.variable} h-full`}>
      <body className="flex min-h-full flex-col">
        <a
          href="#main"
          className="sr-only z-50 rounded-field bg-brand-700 px-4 py-2 text-white focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
        >
          {t("Skip to content")}
        </a>
        <I18nProvider lang={lang}>{children}</I18nProvider>
      </body>
    </html>
  );
}
