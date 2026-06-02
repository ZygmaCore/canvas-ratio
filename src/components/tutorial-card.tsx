type TutorialCardProps = {
  title: string;
  description: string;
  swatchColor: string;
};

export function TutorialCard({
  title,
  description,
  swatchColor,
}: TutorialCardProps) {
  return (
    <article className="rounded-lg border-2 border-[#1A1A1A] bg-white p-5 shadow-[4px_4px_0_#1A1A1A]">
      <span
        className="mb-4 block h-10 w-10 rounded-full border-2 border-[#1A1A1A]"
        style={{ backgroundColor: swatchColor }}
        aria-hidden="true"
      />
      <h2 className="text-xl font-black">{title}</h2>
      <p className="mt-2 text-sm font-medium leading-6 text-[#3d3d3d]">
        {description}
      </p>
    </article>
  );
}
