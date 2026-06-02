type SummaryCardProps = {
  label: string;
  value: string;
  description?: string;
};

export function SummaryCard({ label, value, description }: SummaryCardProps) {
  return (
    <article className="rounded-lg border-2 border-[#1A1A1A] bg-white p-5">
      <p className="text-sm font-black uppercase text-[#2F5FBF]">{label}</p>
      <p className="mt-2 text-4xl font-black">{value}</p>
      {description ? (
        <p className="mt-2 text-sm font-medium text-[#4a4a4a]">
          {description}
        </p>
      ) : null}
    </article>
  );
}
