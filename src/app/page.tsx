import Image from "next/image";
import Link from "next/link";
import { BLACK_CANVAS, PROJECT_COLORS, WHITE_CANVAS } from "@/lib/palette";

const productBasics = [
  {
    title: "White = Free Time",
    body: "Open blocks you can keep flexible or turn into focused work.",
    color: WHITE_CANVAS.hex,
  },
  {
    title: "Black = Unavailable Time",
    body: "Sleep, events, and commitments stay clearly out of the planning pool.",
    color: BLACK_CANVAS.hex,
  },
  {
    title: "Color = Intentional Work",
    body: "Paint the day with the projects and tasks you actually want to move.",
    color: PROJECT_COLORS[5].hex,
  },
];

const steps = [
  "Add unavailable time",
  "Set ratio recommendations",
  "Paint your canvas",
  "Review your day or use Task Dump",
];

const features = [
  {
    title: "Visual day canvas",
    body: "A full day becomes 48 clear half-hour blocks.",
  },
  {
    title: "Soft ratio recommendations",
    body: "Keep your effort balanced without turning planning into accounting.",
  },
  {
    title: "Task Dump prompt workflow",
    body: "List leftover tasks, copy a prompt, and paste the result back when useful.",
  },
  {
    title: "Project Files for long-term goals",
    body: "Track bigger outcomes by blocks, progress, and next steps.",
  },
  {
    title: "Daily Review prompt",
    body: "Turn the painted day into a concise reflection when you are ready.",
  },
];

const heroCells = Array.from({ length: 48 }, (_, index) => {
  if (index < 7 || (index > 41 && index < 46)) return BLACK_CANVAS.hex;
  if (index > 12 && index < 18) return PROJECT_COLORS[0].hex;
  if (index > 22 && index < 30) return PROJECT_COLORS[5].hex;
  if (index > 33 && index < 38) return PROJECT_COLORS[7].hex;
  return WHITE_CANVAS.hex;
});

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-[#F7F8F3] text-[#181818]">
      <header className="sticky top-0 z-20 border-b border-[#DAD7CB] bg-[#F7F8F3]/95 backdrop-blur">
        <nav
          className="mx-auto flex min-h-16 w-full max-w-7xl items-center justify-between gap-4 px-5 sm:px-8 lg:px-10"
          aria-label="Main navigation"
        >
          <Link
            href="/"
            className="flex items-center gap-3 font-black focus:outline-none focus:ring-4 focus:ring-[#6FB6FF]"
          >
            <Image
              src="/canvas-ratio.png"
              alt=""
              width={36}
              height={36}
              priority
              className="h-9 w-9 rounded-full border border-[#1A1A1A] bg-white object-cover"
            />
            <span>Canvas Ratio</span>
          </Link>

          <div className="hidden items-center gap-7 text-sm font-bold text-[#484840] md:flex">
            <Link className="hover:text-[#2F5FBF]" href="/canvas">
              Canvas
            </Link>
            <Link className="hover:text-[#2F5FBF]" href="/project-files">
              Project Files
            </Link>
            <Link className="hover:text-[#2F5FBF]" href="#how-it-works">
              How It Works
            </Link>
          </div>

          <Link
            href="/canvas"
            className="min-h-11 border-2 border-[#1A1A1A] bg-[#1A1A1A] px-4 py-2 text-sm font-black text-white shadow-[3px_3px_0_#FFD91A] transition hover:bg-[#2F5FBF] focus:outline-none focus:ring-4 focus:ring-[#6FB6FF]"
          >
            Open Canvas
          </Link>
        </nav>
      </header>

      <section className="relative isolate overflow-hidden border-b border-[#DAD7CB]">
        <div className="absolute -right-24 top-72 -z-10 grid w-[34rem] grid-cols-8 gap-2 opacity-20 sm:-right-20 sm:top-44 sm:w-[48rem] sm:grid-cols-12 sm:gap-3 lg:-right-40 lg:top-28 lg:w-[50rem] lg:opacity-35">
          {heroCells.map((color, index) => (
            <span
              key={index}
              className="aspect-square border border-[#1A1A1A]"
              style={{ backgroundColor: color }}
              aria-hidden="true"
            />
          ))}
        </div>
        <div className="mx-auto flex min-h-[72vh] max-w-7xl flex-col justify-center px-5 py-20 sm:px-8 lg:px-10">
          <div className="max-w-3xl">
            <p className="text-sm font-black uppercase text-[#2F5FBF]">
              Local-first day planning
            </p>
            <h1 className="mt-5 text-6xl font-black leading-none sm:text-7xl lg:text-8xl">
              Canvas Ratio
            </h1>
            <p className="mt-6 max-w-2xl text-xl font-bold leading-8 text-[#3B3B35] sm:text-2xl sm:leading-9">
              A visual time architecture system for painting your day with free,
              unavailable, and intentional blocks.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/canvas"
                className="min-h-12 border-2 border-[#1A1A1A] bg-[#1A1A1A] px-6 py-3 text-center text-base font-black text-white shadow-[4px_4px_0_#FFD91A] transition hover:bg-[#2F5FBF] focus:outline-none focus:ring-4 focus:ring-[#6FB6FF]"
              >
                Open Canvas
              </Link>
              <Link
                href="/project-files"
                className="min-h-12 border-2 border-[#1A1A1A] bg-white px-6 py-3 text-center text-base font-black transition hover:bg-[#FFD91A] focus:outline-none focus:ring-4 focus:ring-[#6FB6FF]"
              >
                View Project Files
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-4 px-5 py-14 sm:px-8 md:grid-cols-3 lg:px-10">
        {productBasics.map((item) => (
          <article
            key={item.title}
            className="rounded-lg border border-[#DAD7CB] bg-white p-6 shadow-[0_18px_50px_rgba(24,24,24,0.05)]"
          >
            <span
              className="block h-10 w-10 rounded-sm border-2 border-[#1A1A1A]"
              style={{ backgroundColor: item.color }}
              aria-hidden="true"
            />
            <h2 className="mt-5 text-xl font-black">{item.title}</h2>
            <p className="mt-2 text-sm font-bold leading-6 text-[#59584E]">
              {item.body}
            </p>
          </article>
        ))}
      </section>

      <section
        id="how-it-works"
        className="border-y border-[#DAD7CB] bg-white"
      >
        <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8 lg:px-10">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <p className="text-sm font-black uppercase text-[#2F5FBF]">
                How it works
              </p>
              <h2 className="mt-3 text-3xl font-black sm:text-4xl">
                Plan the day at a glance.
              </h2>
            </div>
            <p className="max-w-xl text-base font-bold leading-7 text-[#59584E]">
              Keep the canvas central, then use ratios and review tools only
              when they help.
            </p>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, index) => (
              <article
                key={step}
                className="rounded-lg border border-[#DAD7CB] bg-[#F7F8F3] p-5"
              >
                <span className="grid h-10 w-10 place-items-center rounded-full bg-[#FFD91A] text-sm font-black">
                  {index + 1}
                </span>
                <h3 className="mt-5 text-lg font-black leading-6">{step}</h3>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-14 sm:px-8 lg:px-10">
        <div className="max-w-2xl">
          <p className="text-sm font-black uppercase text-[#2F5FBF]">
            Product features
          </p>
          <h2 className="mt-3 text-3xl font-black sm:text-4xl">
            A calmer way to see your time.
          </h2>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <article
              key={feature.title}
              className="rounded-lg border border-[#DAD7CB] bg-white p-6 shadow-[0_18px_50px_rgba(24,24,24,0.05)]"
            >
              <h3 className="text-xl font-black">{feature.title}</h3>
              <p className="mt-3 text-sm font-bold leading-6 text-[#59584E]">
                {feature.body}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-[#DAD7CB] bg-[#1A1A1A] text-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-5 py-14 sm:px-8 lg:grid-cols-[0.8fr_1.2fr] lg:px-10">
          <div>
            <p className="text-sm font-black uppercase text-[#FFD91A]">
              Privacy and control
            </p>
            <h2 className="mt-3 text-3xl font-black sm:text-4xl">
              Local-first by default.
            </h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              "Works locally",
              "No AI API call by default",
              "Prompt copying is manual",
              "You control what gets pasted into external AI",
            ].map((item) => (
              <div
                key={item}
                className="rounded-lg border border-white/20 bg-white/[0.08] p-4 text-sm font-black"
              >
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-16 text-center sm:px-8 lg:px-10">
        <h2 className="text-4xl font-black sm:text-5xl">
          Start painting your day.
        </h2>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href="/canvas"
            className="min-h-12 border-2 border-[#1A1A1A] bg-[#1A1A1A] px-6 py-3 text-center text-base font-black text-white shadow-[4px_4px_0_#FFD91A] transition hover:bg-[#2F5FBF] focus:outline-none focus:ring-4 focus:ring-[#6FB6FF]"
          >
            Open Canvas
          </Link>
          <Link
            href="/project-files"
            className="min-h-12 border-2 border-[#1A1A1A] bg-white px-6 py-3 text-center text-base font-black transition hover:bg-[#FFD91A] focus:outline-none focus:ring-4 focus:ring-[#6FB6FF]"
          >
            Project Files
          </Link>
        </div>
      </section>
    </main>
  );
}
