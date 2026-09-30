import Link from "next/link";
import { Suspense, type CSSProperties } from "react";
import { HeroScene } from "@/components/home/hero-scene";
import {
  ArrowIcon,
  BasketIcon,
  BikeIcon,
  CheckIcon,
  HandshakeIcon,
  HomeHeartIcon,
  PlateIcon,
} from "@/components/home/icons";
import { Skeleton } from "@/components/ui";
import { getPublicImpact } from "@/lib/donations/service";
import { cn, formatNumber } from "@/lib/utils";

const d = (ms: number) => ({ "--d": `${ms}ms` }) as CSSProperties;

const STEPS = [
  { title: "Donate", text: "Post surplus food in under a minute: what, how much, and when to collect.", Icon: BasketIcon },
  { title: "Match", text: "A verified NGO nearby accepts it, often within minutes.", Icon: HandshakeIcon },
  { title: "Pickup", text: "A volunteer collects the food from your door, on time.", Icon: BikeIcon },
  { title: "Delivery", text: "It reaches the NGO while still fresh and safe to eat.", Icon: HomeHeartIcon },
  { title: "Complete", text: "Meals are served and your impact shows on your dashboard.", Icon: PlateIcon },
];

const DONORS = ["Restaurants", "Hotels", "Bakeries", "Supermarkets", "Wedding halls", "Caterers", "Offices", "Households"];

export default function HomePage() {
  return (
    <>
      {/* ------------------------------------------------------------ HERO */}
      <section className="grain relative overflow-hidden bg-cream-100">
        <div
          aria-hidden
          className="absolute -top-40 -right-40 size-[38rem] rounded-full bg-brand-100/70 blur-3xl"
        />
        <div
          aria-hidden
          className="absolute -bottom-48 -left-40 size-[30rem] rounded-full bg-accent-100/80 blur-3xl"
        />

        <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 pt-10 pb-16 sm:px-6 md:pt-16 lg:grid-cols-[1.05fr_1fr] lg:gap-6 lg:pb-24">
          <div className="max-w-xl">
            <h1
              className="animate-rise font-display text-[2.75rem] leading-[1.02] font-semibold tracking-tight text-brand-950 sm:text-6xl lg:text-[4.25rem]"
              style={d(100)}
            >
              Good food should feed <span className="italic">people</span>,{" "}
              <span className="relative inline-block whitespace-nowrap text-brand-600">
                not landfills.
                <svg
                  aria-hidden
                  viewBox="0 0 300 20"
                  preserveAspectRatio="none"
                  className="absolute -bottom-2 left-0 h-3 w-full text-accent-400 sm:-bottom-3 sm:h-4"
                >
                  <path
                    d="M3 14C60 5 140 3 297 9"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="7"
                    strokeLinecap="round"
                    pathLength={1}
                    strokeDasharray="1"
                    strokeDashoffset="1"
                    className="animate-draw"
                    style={d(900)}
                  />
                </svg>
              </span>
            </h1>

            <p className="mt-7 animate-rise text-lg leading-relaxed text-ink-600 sm:text-xl" style={d(250)}>
              FoodBridge connects your surplus food with NGOs and volunteers nearby. We pick it up and deliver it while
              it&rsquo;s still fresh.
            </p>

            <div className="mt-9 flex animate-rise flex-col gap-3 sm:flex-row" style={d(380)}>
              <Link
                href="/register?role=donor"
                className="group inline-flex h-14 items-center justify-center gap-2 rounded-full bg-brand-600 px-7 text-base font-semibold text-white shadow-glow transition-all duration-300 hover:-translate-y-0.5 hover:bg-brand-700"
              >
                Donate food
                <ArrowIcon className="size-5 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
              <Link
                href="#how-it-works"
                className="inline-flex h-14 items-center justify-center rounded-full border border-brand-900/15 bg-white/60 px-7 text-base font-semibold text-brand-900 backdrop-blur transition-colors hover:bg-white"
              >
                See how it works
              </Link>
            </div>

            <ul className="mt-8 flex animate-rise flex-wrap gap-x-6 gap-y-2 text-sm text-ink-600" style={d(500)}>
              {["Free for donors", "Pickup from your door", "Verified NGOs"].map((t) => (
                <li key={t} className="flex items-center gap-2">
                  <CheckIcon className="size-4 text-brand-600" />
                  {t}
                </li>
              ))}
            </ul>
          </div>

          <HeroScene />
        </div>
      </section>

      {/* --------------------------------------------------------- MARQUEE */}
      <section aria-label="Who donates" className="overflow-hidden border-y border-brand-900 bg-brand-950 py-5">
        <p className="sr-only">Donors include {DONORS.join(", ")}.</p>
        <div aria-hidden className="flex w-max animate-marquee hover:[animation-play-state:paused]">
          {[0, 1].map((copy) => (
            <ul key={copy} className="flex shrink-0 items-center">
              {DONORS.map((name) => (
                <li
                  key={name}
                  className="flex items-center gap-8 pr-8 font-display text-2xl text-cream-100 italic sm:text-3xl"
                >
                  {name}
                  <svg viewBox="0 0 24 24" className="size-5 text-accent-400" fill="currentColor">
                    <path d="M12 0c.6 6.3 5.7 11.4 12 12-6.3.6-11.4 5.7-12 12-.6-6.3-5.7-11.4-12-12C6.3 11.4 11.4 6.3 12 0Z" />
                  </svg>
                </li>
              ))}
            </ul>
          ))}
        </div>
      </section>

      {/* ---------------------------------------------------- HOW IT WORKS */}
      <section id="how-it-works" className="scroll-mt-20 py-20 md:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <SectionHeading
            eyebrow="How it works"
            title={
              <>
                From your kitchen to someone&rsquo;s plate in <em className="text-brand-600">five</em> steps
              </>
            }
          />

          <ol className="relative mt-14 grid gap-10 md:grid-cols-5 md:gap-6">
            {/* journey line that draws itself as you scroll */}
            <svg
              aria-hidden
              viewBox="0 0 1000 40"
              preserveAspectRatio="none"
              className="absolute top-8 left-[10%] hidden h-10 w-4/5 -translate-y-1/2 md:block"
            >
              <path
                d="M0 20C120 -5 180 45 250 20S380 -5 500 20 620 45 750 20 880 -5 1000 20"
                fill="none"
                stroke="var(--color-accent-400)"
                strokeWidth="3"
                strokeLinecap="round"
                pathLength={1}
                className="reveal-line"
                vectorEffect="non-scaling-stroke"
              />
            </svg>

            {STEPS.map(({ title, text, Icon }, i) => (
              <li key={title} className="reveal relative flex gap-5 md:flex-col md:items-center md:text-center">
                <div className="group relative shrink-0">
                  <span className="grid size-16 place-items-center rounded-full border border-brand-900/10 bg-white text-brand-700 shadow-card transition-all duration-500 group-hover:-translate-y-1 group-hover:rotate-6 group-hover:bg-brand-600 group-hover:text-white">
                    <Icon className="size-7" />
                  </span>
                  <span className="absolute -top-1 -right-1 grid size-6 place-items-center rounded-full bg-accent-400 text-xs font-bold text-brand-950 ring-4 ring-cream-50">
                    {i + 1}
                  </span>
                </div>
                <div>
                  <h3 className="font-display text-xl font-semibold text-brand-950">{title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-ink-600">{text}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ---------------------------------------------------------- IMPACT */}
      <section id="impact" className="grain scroll-mt-20 overflow-hidden bg-brand-950 py-20 text-cream-50 md:py-28">
        <div className="relative mx-auto grid max-w-6xl gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:items-center">
          <div
            aria-hidden
            className="absolute -top-24 -left-24 size-80 rounded-full bg-brand-600/30 blur-3xl"
          />
          <div className="reveal relative">
            <p className="text-sm font-semibold tracking-widest text-accent-300 uppercase">Why it matters</p>
            <p className="mt-4 font-display text-3xl leading-tight font-medium sm:text-4xl lg:text-[2.75rem]">
              Roughly <span className="text-accent-300 italic">one-third</span> of all food produced is lost or
              wasted, while millions go hungry.
            </p>
            <p className="mt-5 max-w-md text-brand-200">
              Every donation on FoodBridge moves good food one step closer to a plate. Here&rsquo;s our impact so far.
            </p>
            <p className="mt-3 text-xs text-brand-300/80">Source: FAO, Global Food Losses and Food Waste.</p>
          </div>

          <Suspense fallback={<ImpactSkeleton />}>
            <ImpactStats />
          </Suspense>
        </div>
      </section>

      {/* ------------------------------------------------------ AUDIENCES */}
      <section id="join" className="scroll-mt-20 py-20 md:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <SectionHeading
            eyebrow="Get involved"
            title={
              <>
                One platform, <em className="text-brand-600">three</em> ways to help
              </>
            }
          />

          <div className="mt-12 grid gap-5 lg:grid-cols-3 lg:grid-rows-2">
            {/* Donor — featured */}
            <Link
              href="/register?role=donor"
              className="reveal group grain relative flex flex-col overflow-hidden rounded-[1.75rem] bg-brand-700 p-8 text-cream-50 lg:col-span-2 lg:row-span-2 lg:p-10"
            >
              <PlateArt />
              <p className="relative text-sm font-semibold tracking-widest text-accent-300 uppercase">For donors</p>
              <h3 className="relative mt-3 max-w-md font-display text-3xl leading-tight font-semibold sm:text-4xl">
                Restaurants, hotels, shops &amp; households
              </h3>
              <ul className="relative mt-6 space-y-3 text-brand-100">
                {["Post food in about 60 seconds", "Track every donation live", "See how many meals you saved"].map(
                  (p) => (
                    <li key={p} className="flex items-center gap-3">
                      <span className="grid size-6 place-items-center rounded-full bg-accent-400 text-brand-950">
                        <CheckIcon className="size-3.5" />
                      </span>
                      {p}
                    </li>
                  ),
                )}
              </ul>
              <span className="relative mt-auto inline-flex items-center gap-2 self-start rounded-full bg-cream-50 px-6 py-3 pt-3 font-semibold text-brand-900 transition-all duration-300 group-hover:gap-3 group-hover:bg-accent-300 max-lg:mt-8">
                Start donating <ArrowIcon className="size-5" />
              </span>
            </Link>

            <AudienceCard
              href="/register?role=ngo"
              eyebrow="For NGOs"
              title="Shelters, orphanages & community kitchens"
              text="Get alerts for nearby food and accept only what you can serve."
              cta="Register your NGO"
              tone="cream"
            />
            <AudienceCard
              href="/register?role=volunteer"
              eyebrow="For volunteers"
              title="Students, riders & neighbours"
              text="Pick pickup tasks near you and see the meals you helped deliver."
              cta="Become a volunteer"
              tone="saffron"
            />
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------ CTA */}
      <section className="px-4 pb-20 sm:px-6 md:pb-28">
        <div className="reveal grain relative mx-auto flex max-w-6xl flex-col items-start gap-8 overflow-hidden rounded-[2rem] bg-accent-400 px-6 py-12 sm:px-12 md:flex-row md:items-center md:justify-between">
          <div className="relative max-w-xl">
            <h2 className="font-display text-4xl leading-tight font-semibold text-brand-950 sm:text-5xl">
              Have extra food <em>today?</em>
            </h2>
            <p className="mt-3 text-lg text-brand-900/80">
              Post it now. A nearby NGO could have it on plates tonight.
            </p>
            <Link
              href="/register?role=donor"
              className="group mt-7 inline-flex h-14 items-center gap-2 rounded-full bg-brand-950 px-7 font-semibold text-cream-50 transition-all duration-300 hover:-translate-y-0.5 hover:bg-brand-900"
            >
              Donate food
              <ArrowIcon className="size-5 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </div>
          <SpinningBadge />
        </div>
      </section>
    </>
  );
}

/* --------------------------------------------------------------- pieces */

function SectionHeading({ eyebrow, title }: { eyebrow: string; title: React.ReactNode }) {
  return (
    <div className="reveal max-w-2xl">
      <p className="flex items-center gap-3 text-sm font-semibold tracking-widest text-brand-700 uppercase">
        <span className="h-px w-8 bg-accent-500" />
        {eyebrow}
      </p>
      <h2 className="mt-4 font-display text-4xl leading-[1.1] font-semibold tracking-tight text-brand-950 sm:text-5xl">
        {title}
      </h2>
    </div>
  );
}

function AudienceCard({
  href,
  eyebrow,
  title,
  text,
  cta,
  tone,
}: {
  href: string;
  eyebrow: string;
  title: string;
  text: string;
  cta: string;
  tone: "cream" | "saffron";
}) {
  return (
    <Link
      href={href}
      className={cn(
        "reveal group relative flex flex-col overflow-hidden rounded-[1.75rem] border p-7 transition-all duration-500 hover:-translate-y-1 hover:shadow-raised",
        tone === "cream" ? "border-cream-200 bg-cream-100" : "border-accent-100 bg-accent-50",
      )}
    >
      <p className="text-sm font-semibold tracking-widest text-brand-700 uppercase">{eyebrow}</p>
      <h3 className="mt-2 font-display text-2xl leading-snug font-semibold text-brand-950">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-ink-600">{text}</p>
      <span className="mt-6 inline-flex items-center gap-2 font-semibold text-brand-800 transition-all duration-300 group-hover:gap-3">
        {cta} <ArrowIcon className="size-4" />
      </span>
      <span
        aria-hidden
        className="absolute -right-10 -bottom-10 size-32 rounded-full border-[14px] border-brand-900/5 transition-transform duration-700 group-hover:scale-125"
      />
    </Link>
  );
}

/** Decorative plate + cutlery for the donor card. */
function PlateArt() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 200 200"
      className="pointer-events-none absolute -right-16 -bottom-16 size-80 text-brand-500/40 transition-transform duration-[1.2s] ease-out group-hover:rotate-12 sm:size-96"
      fill="none"
      stroke="currentColor"
    >
      <circle cx="100" cy="100" r="80" strokeWidth="2" />
      <circle cx="100" cy="100" r="58" strokeWidth="2" strokeDasharray="3 7" />
      <circle cx="100" cy="100" r="36" strokeWidth="2" />
      <path d="M100 20v-14M100 194v-14M20 100H6M194 100h-14" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function SpinningBadge() {
  return (
    <div aria-hidden className="relative size-40 shrink-0 self-center sm:size-48">
      <svg viewBox="0 0 200 200" className="size-full animate-spin-slow [animation-duration:18s]">
        <defs>
          <path id="badge-circle" d="M100 100m-78 0a78 78 0 1 1 156 0a78 78 0 1 1-156 0" />
        </defs>
        <text className="fill-brand-950 font-display text-[19px] font-semibold tracking-[0.2em] uppercase">
          <textPath href="#badge-circle">Donate · Rescue · Share · Feed ·</textPath>
        </text>
      </svg>
      <div className="absolute inset-0 m-auto grid size-20 place-items-center rounded-full bg-brand-950 text-accent-300 sm:size-24">
        <svg viewBox="0 0 24 24" fill="currentColor" className="size-9 animate-beat">
          <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z" />
        </svg>
      </div>
    </div>
  );
}

async function ImpactStats() {
  const impact = await getPublicImpact();
  const stats = [
    { value: impact.meals, label: "Meals saved" },
    { value: impact.completed, label: "Donations completed" },
    { value: impact.donors, label: "Registered donors" },
    { value: impact.partners, label: "NGO & volunteer partners" },
  ];
  return (
    <dl className="relative grid grid-cols-2 gap-px overflow-hidden rounded-[1.75rem] bg-white/10 ring-1 ring-white/10">
      {stats.map((s, i) => (
        <div
          key={s.label}
          className="reveal flex flex-col-reverse bg-brand-950/90 p-6 transition-colors duration-500 hover:bg-brand-900 sm:p-8"
          style={d(i * 80)}
        >
          <dt className="mt-2 text-sm text-brand-200">{s.label}</dt>
          <dd className="font-display text-5xl font-semibold text-accent-300 tabular-nums sm:text-6xl">
            {formatNumber(s.value)}
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
        <Skeleton key={i} className="h-36 rounded-card bg-white/10" />
      ))}
    </div>
  );
}
