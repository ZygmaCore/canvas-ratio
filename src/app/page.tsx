import Image from "next/image";
import Link from "next/link";
import { TutorialCard } from "@/components/tutorial-card";
import {
  BLACK_CANVAS,
  PROJECT_COLORS,
  WHITE_CANVAS,
} from "@/lib/palette";

const tutorialCards = [
  {
    title: "White Canvas",
    description: "Free time that can still become anything.",
    swatchColor: WHITE_CANVAS.hex,
  },
  {
    title: "Black Canvas",
    description: "Sleep, random events, and unavailable time.",
    swatchColor: BLACK_CANVAS.hex,
  },
  {
    title: "Colored Canvas",
    description: "Projects and tasks you choose for the day.",
    swatchColor: PROJECT_COLORS[2].hex,
  },
  {
    title: "Finish the Day",
    description: "Generate a warm AI or mock journal.",
    swatchColor: PROJECT_COLORS[5].hex,
  },
];

export default function LandingPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-5 py-8 sm:px-8 lg:px-10">
      <section className="grid flex-1 items-center gap-10 py-8 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="max-w-2xl">
          <Image
            src="/canvas-ratio.png"
            alt="Canvas Ratio logo"
            width={124}
            height={124}
            priority
            className="mb-5 h-28 w-28 rounded-full border-2 border-[#1A1A1A] bg-white object-cover shadow-[4px_4px_0_#1A1A1A] sm:h-32 sm:w-32"
          />
          <p className="mb-4 inline-flex border border-[#1A1A1A] bg-[#FFD91A] px-3 py-1 text-sm font-bold uppercase tracking-wide">
            Day 7 MVP
          </p>
          <h1 className="text-5xl font-black leading-tight sm:text-6xl lg:text-7xl">
            Canvas Ratio
          </h1>
          <p className="mt-5 max-w-xl text-xl font-medium leading-8 text-[#323232]">
            A drawing-book approach to daily time allocation.
          </p>
          <Link
            href="/canvas"
            className="mt-8 inline-flex min-h-12 items-center justify-center border-2 border-[#1A1A1A] bg-[#FF6A2A] px-6 py-3 text-base font-black text-white shadow-[4px_4px_0_#1A1A1A] transition hover:-translate-y-0.5 hover:shadow-[6px_6px_0_#1A1A1A] focus:outline-none focus:ring-4 focus:ring-[#6FB6FF]"
          >
            Open Today’s Canvas
          </Link>
        </div>

        <div className="relative mx-auto grid aspect-square w-full max-w-md place-items-center">
          <div className="absolute inset-0 rotate-3 border-2 border-[#1A1A1A] bg-white shadow-[8px_8px_0_#6FB6FF]" />
          <div className="absolute inset-8 -rotate-2 border-2 border-[#1A1A1A] bg-[#FFFFFF]" />
          <div className="relative flex aspect-square w-64 items-center justify-center rounded-full border-4 border-[#1A1A1A] bg-[#FFFFFF] shadow-[inset_0_0_0_18px_#FFD7BF] sm:w-72">
            <div className="grid grid-cols-4 gap-2">
              {PROJECT_COLORS.slice(0, 8).map((color) => (
                <span
                  key={color.hex}
                  className="h-8 w-8 border-2 border-[#1A1A1A]"
                  style={{ backgroundColor: color.hex }}
                  aria-hidden="true"
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 pb-8 sm:grid-cols-2 lg:grid-cols-4">
        {tutorialCards.map((card) => (
          <TutorialCard
            key={card.title}
            title={card.title}
            description={card.description}
            swatchColor={card.swatchColor}
          />
        ))}
      </section>
    </main>
  );
}
