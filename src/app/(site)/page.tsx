import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Suspense, type CSSProperties, type ReactNode } from "react";
import { SITE_COPY, WASTE_KG_PER_SECOND, type SiteCopy } from "@/components/home/copy";
import {
  ArrowIcon,
  BasketIcon,
  BikeIcon,
  CheckIcon,
  HandshakeIcon,
  HomeHeartIcon,
  PlateIcon,
} from "@/components/home/icons";
import { PHOTOS, type PhotoKey } from "@/components/home/photos";
import { WasteCounter } from "@/components/home/waste-counter";
import { Skeleton } from "@/components/ui";
import { getPublicImpact } from "@/lib/donations/service";
import { formatCount, toBnDigits, type Lang } from "@/lib/i18n";
import { getLang } from "@/lib/i18n-server";
import { cn } from "@/lib/utils";

const d = (ms: number) => ({ "--d": `${ms}ms` }) as CSSProperties;

export async function generateMetadata(): Promise<Metadata> {
  const { meta, hero } = SITE_COPY[await getLang()];
  return {
    title: { absolute: meta.title },
    description: meta.description,
    keywords: [
      "food donation Bangladesh",
      "donate food Dhaka",
      "food waste in Bangladesh",
      "surplus food donation",
      "food insecurity Bangladesh",
      "hunger in Bangladesh",
      "food bank Dhaka",
      "volunteer food delivery",
      "খাবার দান",
      "খাদ্য অপচয়",
    ],
    openGraph: {
      title: meta.title,
      description: meta.description,
      type: "website",
      images: [{ url: PHOTOS.handsRice.src.src, alt: hero.photoAlt }],
    },
  };
}

type RoleKey = "donor" | "ngo" | "volunteer";

/** Who acts at each of the five workflow steps (copy.how.steps), and its icon. */
const STEP_META: { role: RoleKey; Icon: typeof BasketIcon }[] = [
  { role: "donor", Icon: BasketIcon },
  { role: "ngo", Icon: HandshakeIcon },
  { role: "volunteer", Icon: BikeIcon },
  { role: "volunteer", Icon: HomeHeartIcon },
  { role: "ngo", Icon: PlateIcon },
];

const ROLE_TONE: Record<RoleKey, string> = {
  donor: "border-accent-400/30 bg-accent-400/10 text-accent-200",
  ngo: "border-brand-400/30 bg-brand-400/10 text-brand-200",
  volunteer: "border-mist-300/25 bg-white/5 text-mist-200",
};

const num = (value: number, lang: Lang) => (lang === "bn" ? toBnDigits(String(value)) : String(value));

export default async function HomePage() {
  const lang = await getLang();
  const t = SITE_COPY[lang];

  return (
    <div lang={lang} className="bg-night-950 text-mist-300">
      <script
        type="application/ld+json"
        // Static, server-authored JSON (no user input).
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "NGO",
            name: "FoodBridge",
            description: t.meta.description,
            areaServed: { "@type": "Country", name: "Bangladesh" },
            knowsAbout: ["Food donation", "Food waste", "Food insecurity", "Food rescue"],
          }),
        }}
      />
      <Hero t={t} />
      <FoodWaste t={t} lang={lang} />
      <Hunger t={t} />
      <Bridge t={t} />
      <HowItWorks t={t} />
      <Roles t={t} />
      <Impact t={t} lang={lang} />
      <FinalCta t={t} />
    </div>
  );
}

/* ----------------------------------------------------------------- HERO */

function Hero({ t }: { t: SiteCopy }) {
  const h = t.hero;
  return (
    <section className="grain-night relative overflow-hidden">
      {/* a real Dhaka night, pushed back so the words lead */}
      <Image
        src={PHOTOS.heroRickshaw.src}
        alt={h.bgAlt}
        priority
        placeholder="blur"
        sizes="100vw"
        className="absolute inset-0 -z-10 size-full animate-ken object-cover brightness-[0.4] saturate-[0.8]"
      />
      <div aria-hidden className="absolute inset-0 -z-10 bg-linear-to-r from-night-950 via-night-950/85 to-night-950/40" />
      <div aria-hidden className="absolute inset-0 -z-10 bg-linear-to-t from-night-950 via-transparent to-night-950/60" />
      <div
        aria-hidden
        className="absolute -top-56 right-[-12rem] -z-10 size-[46rem] animate-ember rounded-full bg-[radial-gradient(closest-side,rgb(246_177_58/0.18),transparent)]"
      />

      <div className="relative mx-auto grid max-w-6xl gap-12 px-4 pt-12 pb-14 sm:px-6 md:pt-20 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:gap-14">
        <div className="max-w-2xl">
          <h1 className="font-display text-[2.4rem] leading-[1.08] font-semibold tracking-tight text-cream-50 sm:text-5xl lg:text-[3.25rem]">
            <span
              className="flex animate-rise items-center gap-3 font-sans text-sm font-semibold tracking-[0.2em] text-accent-300 uppercase"
              style={d(50)}
            >
              <span aria-hidden className="size-2.5 rounded-full bg-accent-400" />
              {h.kicker}
            </span>
            <span className="mt-6 block animate-rise" style={d(150)}>
              {h.title1}
            </span>
            <span className="mt-3 block animate-rise text-accent-300 italic" style={d(450)}>
              {h.title2}
            </span>
          </h1>

          <p className="mt-7 max-w-xl animate-rise text-lg leading-relaxed text-mist-200" style={d(700)}>
            {h.lede}
          </p>

          <div className="mt-9 flex animate-rise flex-col gap-3 sm:flex-row" style={d(850)}>
            <Link
              href="/register?role=donor"
              className="group inline-flex h-14 items-center justify-center gap-2 rounded-full bg-accent-400 px-7 text-base font-semibold text-night-950 shadow-[0_12px_40px_-10px_rgb(246_177_58/0.6)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-accent-300"
            >
              {h.ctaDonate}
              <ArrowIcon className="size-5 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
            <Link
              href="#how-it-works"
              className="inline-flex h-14 items-center justify-center rounded-full border border-white/15 bg-white/5 px-7 text-base font-semibold text-cream-50 backdrop-blur transition-colors hover:bg-white/10"
            >
              {h.ctaHow}
            </Link>
          </div>

          <ul className="mt-8 flex animate-rise flex-wrap gap-x-6 gap-y-2 text-sm text-mist-200" style={d(1000)}>
            {h.trust.map((item) => (
              <li key={item} className="flex items-center gap-2">
                <CheckIcon className="size-4 text-brand-300" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <figure className="relative mx-auto w-full max-w-md animate-rise lg:max-w-none" style={d(600)}>
          <div className="relative overflow-hidden rounded-[2rem] shadow-[0_30px_80px_-20px_rgb(0_0_0/0.8)] ring-1 ring-white/10">
            <Image
              src={PHOTOS.handsRice.src}
              alt={h.photoAlt}
              priority
              placeholder="blur"
              sizes="(min-width: 1024px) 420px, (min-width: 640px) 448px, 100vw"
              className="aspect-[4/4.4] w-full object-cover brightness-[0.78] contrast-110 saturate-[0.75] sepia-[0.2]"
            />
            <div aria-hidden className="absolute inset-0 bg-linear-to-t from-night-950 via-night-950/30 to-transparent" />
            <figcaption className="absolute inset-x-0 bottom-0 p-6 font-display text-xl leading-snug text-cream-50 sm:text-2xl">
              <span aria-hidden className="mb-3 block h-px w-10 bg-accent-400" />
              {h.photoCaption}
            </figcaption>
          </div>
        </figure>
      </div>

      {/* the problem in three numbers */}
      <div className="relative mx-auto max-w-6xl px-4 pb-14 sm:px-6">
        <dl
          className="grid animate-rise gap-px overflow-hidden rounded-card bg-white/10 ring-1 ring-white/10 sm:grid-cols-3"
          style={d(1100)}
        >
          {h.strip.map((s) => (
            <div key={s.value} className="flex flex-col-reverse bg-night-950/85 p-5 backdrop-blur sm:p-6">
              <dt className="mt-1 text-sm text-mist-300">
                {s.label} <span className="text-mist-400">· {s.source}</span>
              </dt>
              <dd className="font-display text-3xl font-semibold text-accent-300 sm:text-4xl">{s.value}</dd>
            </div>
          ))}
        </dl>
        <Credit t={t} photo="heroRickshaw" className="mt-3 text-right" />
      </div>
    </section>
  );
}

/* ----------------------------------------------------------- FOOD WASTE */

function FoodWaste({ t, lang }: { t: SiteCopy; lang: Lang }) {
  const w = t.waste;
  const compareMax = Math.max(...w.compare.map((c) => c.value));
  return (
    <section id="food-waste" className="scroll-mt-20 py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading eyebrow={w.eyebrow} title={w.title} lede={w.lede} />

        {/* live counter + day / month / year */}
        <div className="mt-12 grid gap-5 lg:grid-cols-[1fr_1.4fr]">
          <div className="reveal relative flex flex-col justify-between gap-8 overflow-hidden rounded-[2rem] border border-accent-400/25 bg-linear-to-br from-accent-500/15 via-night-900 to-night-900 p-7 sm:p-9">
            <BinArt />
            <p className="relative max-w-xs text-sm font-medium text-accent-100">{w.counterLabel}</p>
            <div className="relative">
              <p className="font-display text-5xl font-semibold text-accent-300 sm:text-6xl">
                <WasteCounter lang={lang} kgPerSecond={WASTE_KG_PER_SECOND} />{" "}
                <span className="text-2xl text-accent-200">{w.counterUnit}</span>
              </p>
              <p className="mt-3 flex items-center gap-2 text-sm text-mist-300">
                <span aria-hidden className="size-2 animate-ping rounded-full bg-accent-400 motion-only" />
                {w.counterRate}
              </p>
            </div>
          </div>

          <dl
            className="reveal grid grid-cols-2 gap-px overflow-hidden rounded-[2rem] bg-white/10 ring-1 ring-white/10"
            style={d(100)}
          >
            {w.clock.map((c) => (
              <div key={c.label} className="flex flex-col-reverse bg-night-900 p-6 sm:p-7">
                <dt className="mt-1 text-sm text-mist-300">{c.label}</dt>
                <dd className="font-display text-2xl font-semibold text-cream-50 sm:text-3xl lg:text-[2.1rem]">
                  {c.value}{" "}
                  {c.unit && <span className="text-lg font-medium whitespace-nowrap text-mist-300">{c.unit}</span>}
                </dd>
              </div>
            ))}
          </dl>
        </div>
        <Source>{w.clockSource}</Source>

        {/* comparison + whole chain */}
        <div className="mt-12 grid gap-5 lg:grid-cols-2">
          <div className="reveal rounded-[2rem] border border-white/5 bg-night-900 p-7 sm:p-9">
            <h3 className="font-display text-xl font-semibold text-cream-50">{w.compareTitle}</h3>
            <BarList
              rows={w.compare.map((c, i) => ({ ...c, highlight: i === 0 }))}
              max={compareMax}
              format={(v) => num(v, lang)}
            />
            <Source>{w.compareSource}</Source>
            <h3 className="mt-10 font-display text-xl font-semibold text-cream-50">{w.lossTitle}</h3>
            <BarList rows={w.loss} max={30} format={(v) => `${num(v, lang)}%`} compact />
            <Source>{w.chainSource}</Source>
          </div>

          <div className="reveal rounded-[2rem] border border-white/5 bg-night-900 p-7 sm:p-9" style={d(100)}>
            <h3 className="font-display text-xl font-semibold text-cream-50">{w.chainTitle}</h3>
            <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-6">
              {w.chain.map((c) => (
                <div key={c.label} className="flex flex-col-reverse">
                  <dt className="mt-1 text-sm leading-snug text-mist-300">{c.label}</dt>
                  <dd className="font-display text-5xl font-semibold text-accent-300">{c.value}</dd>
                </div>
              ))}
            </dl>
            <Source>{w.chainSource}</Source>
            <figure className="mt-8 overflow-hidden rounded-[1.25rem] ring-1 ring-white/10">
              <Image
                src={PHOTOS.wasteIftarMarket.src}
                alt={w.marketAlt}
                placeholder="blur"
                sizes="(min-width: 1024px) 500px, 100vw"
                className="aspect-[16/9] w-full object-cover brightness-[0.75] saturate-[0.8]"
              />
            </figure>
            <p className="mt-3 text-sm text-mist-300">{w.marketCaption}</p>
            <Credit t={t} photo="wasteIftarMarket" className="mt-1" />
          </div>
        </div>

        <h3 className="reveal mt-20 font-display text-2xl font-semibold text-cream-50 sm:text-3xl">{w.storiesTitle}</h3>
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {w.stories.map((s, i) => (
            <StoryCard
              key={s.photo}
              t={t}
              story={s}
              delay={i * 80}
              sizes="(min-width: 1024px) 270px, (min-width: 640px) 50vw, 100vw"
            />
          ))}
        </div>
      </div>
    </section>
  );
}

/* --------------------------------------------------------------- HUNGER */

function Hunger({ t }: { t: SiteCopy }) {
  const h = t.hunger;
  return (
    <section id="hunger" className="grain-night relative scroll-mt-20 overflow-hidden bg-night-900 py-20 md:py-28">
      <div
        aria-hidden
        className="absolute -top-40 -right-40 size-[34rem] rounded-full bg-[radial-gradient(closest-side,rgb(246_177_58/0.12),transparent)]"
      />
      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading eyebrow={h.eyebrow} title={h.title} lede={h.lede} />

        <div className="mt-12 grid gap-5 lg:grid-cols-[1.05fr_1fr]">
          {/* 1 in 4, drawn as people */}
          <div className="reveal rounded-[2rem] border border-accent-400/20 bg-night-950/60 p-7 sm:p-9">
            <ul aria-hidden className="grid grid-cols-10 gap-x-2 gap-y-3">
              {Array.from({ length: 20 }, (_, i) => (
                <li key={i}>
                  <PersonIcon className={cn("w-full", i % 4 === 0 ? "text-accent-400" : "text-white/15")} />
                </li>
              ))}
            </ul>
            <p className="mt-7 font-display text-5xl font-semibold text-accent-300 sm:text-6xl">{h.peopleValue}</p>
            <p className="mt-2 max-w-md text-mist-200">{h.peopleLabel}</p>
            <Source>{h.peopleSource}</Source>
          </div>

          <dl className="grid gap-px overflow-hidden rounded-[2rem] bg-white/10 ring-1 ring-white/10 sm:grid-cols-2">
            {h.stats.map((s, i) => (
              <div key={s.label} className="reveal flex flex-col-reverse bg-night-900 p-6 sm:p-7" style={d(i * 70)}>
                <dt className="mt-2 text-sm leading-snug text-mist-300">
                  {s.label}
                  <span className="mt-2 block text-xs text-mist-400">— {s.source}</span>
                </dt>
                <dd className="font-display text-3xl font-semibold text-cream-50 sm:text-4xl">{s.value}</dd>
              </div>
            ))}
          </dl>
        </div>

        <h3 className="reveal mt-20 font-display text-2xl font-semibold text-cream-50 sm:text-3xl">{h.storiesTitle}</h3>
        <div className="mt-6 grid gap-5 md:grid-cols-3">
          {h.stories.map((s, i) => (
            <StoryCard key={s.photo} t={t} story={s} delay={i * 80} sizes="(min-width: 768px) 360px, 100vw" />
          ))}
        </div>
      </div>
    </section>
  );
}

/* --------------------------------------------------------------- BRIDGE */

function Bridge({ t }: { t: SiteCopy }) {
  const b = t.bridge;
  const [lead, ...rest] = b.stories;
  return (
    <section id="bridge" className="scroll-mt-20 py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <div className="reveal">
            <Eyebrow>{b.eyebrow}</Eyebrow>
            <h2 className="mt-4 font-display text-4xl leading-[1.1] font-semibold tracking-tight text-cream-50 sm:text-5xl">
              {b.title}
            </h2>
            <p className="mt-5 max-w-lg text-lg leading-relaxed text-mist-300">{b.text}</p>
            <div className="mt-10">
              <BridgeDiagram nodes={b.nodes} notes={b.nodeNotes} />
            </div>
          </div>
          <StoryCard t={t} story={lead} sizes="(min-width: 1024px) 580px, 100vw" large />
        </div>

        <div className="mt-5 grid gap-5 sm:grid-cols-[0.75fr_1.25fr]">
          {rest.map((s, i) => (
            <StoryCard
              key={s.photo}
              t={t}
              story={s}
              delay={i * 80}
              sizes={i === 0 ? "(min-width: 640px) 40vw, 100vw" : "(min-width: 640px) 60vw, 100vw"}
              tall
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function BridgeDiagram({ nodes, notes }: { nodes: string[]; notes: string[] }) {
  return (
    <ol className="relative grid grid-cols-3 gap-2 text-center sm:gap-4">
      <li
        aria-hidden
        className="absolute top-7 right-[16.66%] left-[16.66%] h-px list-none bg-linear-to-r from-mist-400/40 via-accent-400 to-brand-400/60"
      />
      {nodes.map((node, i) => (
        <li key={node} className="relative flex flex-col items-center">
          <span
            className={cn(
              "grid size-14 place-items-center rounded-full border",
              i === 0 && "border-white/10 bg-night-800 text-mist-300",
              i === 1 && "border-accent-400/50 bg-accent-400 text-night-950 shadow-[0_0_40px_-4px_rgb(246_177_58/0.6)]",
              i === 2 && "border-brand-400/40 bg-night-800 text-brand-200",
            )}
          >
            {i === 0 && <BasketIcon className="size-6" />}
            {i === 1 && <BridgeMark className="size-7" />}
            {i === 2 && <HomeHeartIcon className="size-6" />}
          </span>
          <span className="mt-3 text-sm font-semibold text-cream-50 sm:text-base">{node}</span>
          <span className="mt-1 hidden text-xs text-mist-400 sm:block">{notes[i]}</span>
        </li>
      ))}
    </ol>
  );
}

/* --------------------------------------------------------- HOW IT WORKS */

function HowItWorks({ t }: { t: SiteCopy }) {
  const h = t.how;
  return (
    <section id="how-it-works" className="grain-night relative scroll-mt-20 overflow-hidden bg-night-900 py-20 md:py-28">
      <div
        aria-hidden
        className="absolute -right-40 -bottom-40 size-[34rem] rounded-full bg-[radial-gradient(closest-side,rgb(26_125_79/0.18),transparent)]"
      />
      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading eyebrow={h.eyebrow} title={h.title} lede={h.lede} />

        <ol className="relative mt-16 grid gap-10 border-l border-white/10 pl-8 lg:grid-cols-5 lg:gap-6 lg:border-l-0 lg:pl-0">
          {/* journey line that draws itself as you scroll (desktop) */}
          <svg
            aria-hidden
            viewBox="0 0 1000 40"
            preserveAspectRatio="none"
            className="absolute top-8 left-[10%] hidden h-10 w-4/5 -translate-y-1/2 lg:block"
          >
            <path d="M0 20H1000" stroke="rgb(255 255 255 / 0.08)" strokeWidth="2" vectorEffect="non-scaling-stroke" />
            <path
              d="M0 20H1000"
              fill="none"
              stroke="var(--color-accent-400)"
              strokeWidth="2"
              strokeLinecap="round"
              pathLength={1}
              className="reveal-line"
              vectorEffect="non-scaling-stroke"
            />
          </svg>

          {h.steps.map((step, i) => {
            const { role, Icon } = STEP_META[i];
            return (
              <li
                key={step.title}
                className="reveal relative lg:flex lg:flex-col lg:items-center lg:text-center"
                style={d(i * 60)}
              >
                <span aria-hidden className="absolute top-6 -left-8 h-px w-6 bg-white/10 lg:hidden" />
                <div className="group relative w-max">
                  <span className="grid size-16 place-items-center rounded-full border border-white/10 bg-night-850 text-accent-300 transition-all duration-500 group-hover:-translate-y-1 group-hover:border-accent-400/60 group-hover:bg-accent-400 group-hover:text-night-950">
                    <Icon className="size-7" />
                  </span>
                  <span className="absolute -top-1 -right-1 grid size-6 place-items-center rounded-full bg-accent-400 text-xs font-bold text-night-950 ring-4 ring-night-900">
                    {i + 1}
                  </span>
                </div>
                <span
                  className={cn("mt-5 inline-block rounded-full border px-2.5 py-0.5 text-xs font-semibold", ROLE_TONE[role])}
                >
                  {step.who}
                </span>
                <h3 className="mt-2 font-display text-2xl font-semibold text-cream-50">{step.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-mist-300">{step.text}</p>
              </li>
            );
          })}
        </ol>

        <div className="reveal mt-16 flex flex-col gap-4 rounded-card border border-brand-400/20 bg-brand-950/40 p-6 sm:flex-row sm:items-center sm:gap-6">
          <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-brand-600/30 text-brand-200">
            <ShieldIcon className="size-6" />
          </span>
          <div>
            <h3 className="font-display text-lg font-semibold text-cream-50">{h.safetyTitle}</h3>
            <p className="mt-0.5 text-sm text-mist-300">{h.safety}</p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- ROLES */

function Roles({ t }: { t: SiteCopy }) {
  const r = t.roles;
  return (
    <section id="join" className="scroll-mt-20 py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading eyebrow={r.eyebrow} title={r.title} />

        <div className="mt-12 grid gap-5 lg:grid-cols-3">
          <RoleCard t={t} href="/register?role=donor" role={r.donor} Icon={BasketIcon} featured />
          <RoleCard t={t} href="/register?role=ngo" role={r.ngo} Icon={HomeHeartIcon} delay={100} />
          <RoleCard t={t} href="/register?role=volunteer" role={r.volunteer} Icon={BikeIcon} delay={200} />
        </div>

        <p className="reveal mt-8 flex items-center gap-2 text-sm text-mist-400">
          <ShieldIcon className="size-4 shrink-0 text-brand-300" />
          {r.verified}
        </p>
      </div>
    </section>
  );
}

function RoleCard({
  t,
  href,
  role,
  Icon,
  featured,
  delay = 0,
}: {
  t: SiteCopy;
  href: string;
  role: SiteCopy["roles"]["donor"];
  Icon: typeof BasketIcon;
  featured?: boolean;
  delay?: number;
}) {
  const photo = PHOTOS[role.photo];
  return (
    <div style={d(delay)} className="reveal flex flex-col">
      <Link
        href={href}
        className={cn(
          "group relative flex flex-1 flex-col overflow-hidden rounded-[1.75rem] border transition-all duration-500 hover:-translate-y-1",
          featured
            ? "border-accent-300 bg-accent-400 text-night-950 hover:shadow-[0_24px_60px_-20px_rgb(246_177_58/0.6)]"
            : "border-white/10 bg-night-900 text-cream-50 hover:border-white/20 hover:bg-night-850",
        )}
      >
        <div className="relative h-44 overflow-hidden">
          <Image
            src={photo.src}
            alt=""
            placeholder="blur"
            sizes="(min-width: 1024px) 370px, 100vw"
            className="size-full object-cover brightness-[0.8] saturate-[0.85] transition-transform duration-700 group-hover:scale-105"
          />
          <div
            aria-hidden
            className={cn("absolute inset-0 bg-linear-to-t to-transparent", featured ? "from-accent-400" : "from-night-900")}
          />
          <span
            className={cn(
              "absolute bottom-0 left-7 grid size-12 place-items-center rounded-2xl sm:left-8",
              featured ? "bg-night-950 text-accent-300" : "bg-night-950/80 text-accent-300 backdrop-blur",
            )}
          >
            <Icon className="size-6" />
          </span>
        </div>
        <div className="relative flex flex-1 flex-col p-7 pt-5 sm:p-8 sm:pt-6">
          <p
            className={cn(
              "text-xs font-semibold tracking-widest uppercase",
              featured ? "text-night-950/75" : "text-accent-300",
            )}
          >
            {role.tag}
          </p>
          <h3 className="mt-2 font-display text-3xl leading-tight font-semibold">{role.title}</h3>
          <p className={cn("mt-2 text-sm leading-relaxed", featured ? "text-night-950/80" : "text-mist-300")}>
            {role.who}
          </p>
          <ul className="mt-6 space-y-2.5 text-sm">
            {role.points.map((point) => (
              <li key={point} className="flex items-center gap-3">
                <span
                  className={cn(
                    "grid size-5 shrink-0 place-items-center rounded-full",
                    featured ? "bg-night-950 text-accent-300" : "bg-brand-500/20 text-brand-200",
                  )}
                >
                  <CheckIcon className="size-3" />
                </span>
                <span className={featured ? "font-medium" : "text-mist-200"}>{point}</span>
              </li>
            ))}
          </ul>
          <span
            className={cn(
              "mt-8 inline-flex items-center gap-2 self-start rounded-full px-5 py-2.5 text-sm font-semibold transition-all duration-300 group-hover:gap-3",
              featured
                ? "bg-night-950 text-cream-50"
                : "bg-white/10 text-cream-50 group-hover:bg-accent-400 group-hover:text-night-950",
            )}
          >
            {role.cta} <ArrowIcon className="size-4" />
          </span>
        </div>
      </Link>
      <div className="mt-2 min-h-4">
        <Credit t={t} photo={role.photo} />
      </div>
    </div>
  );
}

/* --------------------------------------------------------------- IMPACT */

function Impact({ t, lang }: { t: SiteCopy; lang: Lang }) {
  const im = t.impact;
  return (
    <section id="impact" className="grain-night relative scroll-mt-20 overflow-hidden bg-night-900 py-20 md:py-28">
      <div
        aria-hidden
        className="absolute -top-32 -left-32 size-[30rem] rounded-full bg-[radial-gradient(closest-side,rgb(246_177_58/0.14),transparent)]"
      />
      <div className="relative mx-auto grid max-w-6xl gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:items-center">
        <div className="reveal">
          <Eyebrow>{im.eyebrow}</Eyebrow>
          <h2 className="mt-4 font-display text-4xl leading-[1.1] font-semibold tracking-tight text-cream-50 sm:text-5xl">
            {im.title}
          </h2>
          <p className="mt-5 max-w-md text-mist-300">{im.lede}</p>
          <p className="mt-8 max-w-md border-l-2 border-accent-400 pl-4 font-display text-xl leading-snug text-cream-100 italic">
            {im.methane}
          </p>
        </div>

        <Suspense fallback={<ImpactSkeleton />}>
          <ImpactStats labels={im.stats} lang={lang} />
        </Suspense>
      </div>

      <div className="relative mx-auto mt-16 max-w-6xl px-4 sm:px-6">
        <div className="reveal flex flex-col gap-4 border-t border-white/10 pt-8 md:flex-row md:items-center md:justify-between">
          <p className="text-sm font-semibold text-mist-200">{im.sdgTitle}</p>
          <ul className="flex flex-wrap gap-2">
            {im.sdgs.map((goal) => (
              <li
                key={goal}
                className="rounded-full border border-white/10 bg-white/[0.03] px-3.5 py-1.5 text-xs font-medium text-mist-300"
              >
                {goal}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

async function ImpactStats({ labels, lang }: { labels: string[]; lang: Lang }) {
  const impact = await getPublicImpact();
  const values = [impact.meals, impact.completed, impact.donors, impact.partners];
  return (
    <dl className="relative grid grid-cols-2 gap-px overflow-hidden rounded-[1.75rem] bg-white/10 ring-1 ring-white/10">
      {values.map((value, i) => (
        <div
          key={labels[i]}
          className="reveal flex flex-col-reverse bg-night-950/90 p-6 transition-colors duration-500 hover:bg-night-850 sm:p-8"
          style={d(i * 80)}
        >
          <dt className="mt-2 text-sm text-mist-300">{labels[i]}</dt>
          <dd className="font-display text-4xl font-semibold text-accent-300 tabular-nums sm:text-6xl">
            {formatCount(value, lang)}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function ImpactSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3">
      {[0, 1, 2, 3].map((i) => (
        <Skeleton key={i} className="h-36 rounded-card bg-white/5" />
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ CTA */

function FinalCta({ t }: { t: SiteCopy }) {
  const c = t.cta;
  return (
    <section className="px-4 py-20 sm:px-6 md:py-28">
      <div className="reveal grain relative mx-auto flex max-w-6xl flex-col items-start gap-8 overflow-hidden rounded-[2rem] bg-accent-400 px-6 py-12 sm:px-12 md:flex-row md:items-center md:justify-between">
        <div
          aria-hidden
          className="absolute -top-24 -right-10 size-80 rounded-full bg-[radial-gradient(closest-side,rgb(255_244_214/0.7),transparent)]"
        />
        <div className="relative max-w-xl">
          <h2 className="font-display text-4xl leading-tight font-semibold text-night-950 sm:text-5xl">{c.title}</h2>
          <p className="mt-3 text-lg text-night-950/80">{c.text}</p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/register?role=donor"
              className="group inline-flex h-14 items-center justify-center gap-2 rounded-full bg-night-950 px-7 font-semibold text-cream-50 transition-all duration-300 hover:-translate-y-0.5 hover:bg-night-800"
            >
              {c.donate}
              <ArrowIcon className="size-5 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
            <Link
              href="/register?role=ngo"
              className="inline-flex h-14 items-center justify-center rounded-full border border-night-950/25 px-7 font-semibold text-night-950 transition-colors hover:bg-night-950/10"
            >
              {c.ngo}
            </Link>
          </div>
        </div>
        <SpinningBadge text={c.badge} />
      </div>
    </section>
  );
}

/* --------------------------------------------------------------- pieces */

function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <p className="flex items-center gap-3 text-sm font-semibold tracking-widest text-accent-300 uppercase">
      <span className="h-px w-8 bg-accent-400" />
      {children}
    </p>
  );
}

function SectionHeading({ eyebrow, title, lede }: { eyebrow: string; title: ReactNode; lede?: string }) {
  return (
    <div className="reveal max-w-3xl">
      <Eyebrow>{eyebrow}</Eyebrow>
      <h2 className="mt-4 font-display text-4xl leading-[1.1] font-semibold tracking-tight text-cream-50 sm:text-5xl">
        {title}
      </h2>
      {lede && <p className="mt-5 max-w-2xl text-lg leading-relaxed text-mist-300">{lede}</p>}
    </div>
  );
}

function Source({ children }: { children: ReactNode }) {
  return <p className="mt-4 text-xs text-mist-400">— {children}</p>;
}

/** Author + licence line for Wikimedia Commons photos (nothing for photos without a credit). */
function Credit({ t, photo, className }: { t: SiteCopy; photo: PhotoKey; className?: string }) {
  const credit = PHOTOS[photo].credit;
  if (!credit) return null;
  return (
    <p className={cn("text-[11px] text-mist-400", className)}>
      {t.photo.credit}:{" "}
      <a
        href={credit.href}
        target="_blank"
        rel="noopener noreferrer"
        className="underline-offset-2 hover:text-mist-200 hover:underline"
      >
        {credit.author}, {credit.license}, {t.photo.via}
      </a>
    </p>
  );
}

/** A photograph with a short title and story underneath. */
function StoryCard({
  t,
  story,
  sizes,
  delay = 0,
  large,
  tall,
}: {
  t: SiteCopy;
  story: { photo: PhotoKey; title: string; text: string };
  sizes: string;
  delay?: number;
  large?: boolean;
  tall?: boolean;
}) {
  const photo = PHOTOS[story.photo];
  return (
    <figure className="reveal group" style={d(delay)}>
      <div
        className={cn(
          "relative overflow-hidden rounded-[1.5rem] bg-night-800 ring-1 ring-white/10",
          large ? "aspect-[4/3.2]" : tall ? "h-80 sm:h-[26rem]" : "aspect-[4/5]",
        )}
      >
        <Image
          src={photo.src}
          alt={story.title}
          placeholder="blur"
          sizes={sizes}
          style={photo.position ? { objectPosition: photo.position } : undefined}
          className="size-full object-cover brightness-[0.85] saturate-[0.85] transition-all duration-700 group-hover:scale-[1.04] group-hover:brightness-95"
        />
        <div aria-hidden className="absolute inset-0 bg-linear-to-t from-night-950/70 via-transparent to-transparent" />
      </div>
      <figcaption className="mt-4">
        <h4 className={cn("font-display font-semibold text-cream-50", large ? "text-2xl" : "text-lg")}>{story.title}</h4>
        <p className="mt-1.5 text-sm leading-relaxed text-mist-300">{story.text}</p>
        <Credit t={t} photo={story.photo} className="mt-2" />
      </figcaption>
    </figure>
  );
}

/** Horizontal bars; they grow in on scroll where supported (.reveal-bar). */
function BarList({
  rows,
  max,
  format,
  compact,
}: {
  rows: { label: string; value: number; highlight?: boolean }[];
  max: number;
  format: (v: number) => string;
  compact?: boolean;
}) {
  return (
    <ul className={cn("space-y-3", compact ? "mt-4" : "mt-6")}>
      {rows.map((r) => (
        <li key={r.label} className="grid grid-cols-[6.5rem_1fr_3.5rem] items-center gap-3 text-sm">
          <span className={r.highlight ? "font-semibold text-cream-50" : "text-mist-300"}>{r.label}</span>
          <span className={cn("relative overflow-hidden rounded-full bg-white/5", compact ? "h-2" : "h-3")}>
            <span
              className={cn(
                "reveal-bar absolute inset-y-0 left-0 origin-left rounded-full",
                r.highlight ? "bg-accent-400" : compact ? "bg-accent-400/60" : "bg-mist-400/50",
              )}
              style={{ width: `${(r.value / max) * 100}%` }}
            />
          </span>
          <span className={cn("text-right tabular-nums", r.highlight ? "font-semibold text-accent-300" : "text-mist-200")}>
            {format(r.value)}
          </span>
        </li>
      ))}
    </ul>
  );
}

function SpinningBadge({ text }: { text: string }) {
  return (
    <div aria-hidden className="relative size-40 shrink-0 self-center sm:size-48">
      <svg viewBox="0 0 200 200" className="size-full animate-spin-slow [animation-duration:18s]">
        <defs>
          <path id="badge-circle" d="M100 100m-78 0a78 78 0 1 1 156 0a78 78 0 1 1-156 0" />
        </defs>
        <text className="fill-night-950 font-display text-[19px] font-semibold tracking-[0.2em] uppercase">
          <textPath href="#badge-circle">{text}</textPath>
        </text>
      </svg>
      <div className="absolute inset-0 m-auto grid size-20 place-items-center rounded-full bg-night-950 text-accent-300 sm:size-24">
        <svg viewBox="0 0 24 24" fill="currentColor" className="size-9 animate-beat">
          <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z" />
        </svg>
      </div>
    </div>
  );
}

/** Overflowing bin, drawn faintly behind the waste counter. */
function BinArt() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 120 120"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="pointer-events-none absolute -right-6 -bottom-6 size-52 text-accent-300/[0.08]"
    >
      <path d="M28 44h64l-6 62H34Z" />
      <path d="M22 44h76M50 44V36h20v8" />
      <path d="M46 58v36M60 58v36M74 58v36" />
      <path d="M36 40c4-10 14-12 20-8M64 30c8-6 18-2 20 8M44 26c2-6 10-8 14-4" />
    </svg>
  );
}

function PersonIcon(props: React.ComponentProps<"svg">) {
  return (
    <svg aria-hidden viewBox="0 0 24 32" fill="currentColor" {...props}>
      <circle cx="12" cy="6" r="5" />
      <path d="M3 30v-9a9 9 0 0 1 18 0v9Z" />
    </svg>
  );
}

function BridgeMark(props: React.ComponentProps<"svg">) {
  return (
    <svg aria-hidden viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" {...props}>
      <path d="M3 17c3-7 15-7 18 0" />
      <path d="M3 20h18M8 14.5V20M16 14.5V20M12 13v7" strokeWidth="1.7" />
    </svg>
  );
}

function ShieldIcon(props: React.ComponentProps<"svg">) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M12 3 5 6v5c0 4.5 3 8.4 7 10 4-1.6 7-5.5 7-10V6Z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}
