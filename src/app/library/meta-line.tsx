type MetaLineProps = {
  className?: string;
  collections: string[];
  date: Date;
  tags: string[];
};

export function MetaLine({
  className,
  collections,
  date,
  tags,
}: MetaLineProps) {
  const parts = [
    date.toLocaleDateString("en", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }),
    ...collections,
    ...tags.map((tag) => `#${tag}`),
  ];

  return (
    <p
      className={["wrap-anywhere text-sm text-zinc-500", className]
        .filter(Boolean)
        .join(" ")}
    >
      {parts.join(" · ")}
    </p>
  );
}
