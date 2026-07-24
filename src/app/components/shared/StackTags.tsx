/**
 * The technology list on a project card. A list, not a row of divs: it is a
 * list of things, and screen readers announce the count.
 */
export function StackTags({
  items,
  more,
  className = "",
}: {
  items: readonly string[];
  /** Collapsed remainder, rendered as one muted chip so the row stays short. */
  more?: string;
  className?: string;
}) {
  return (
    <ul className={`flex flex-wrap gap-2 list-none p-0 m-0 ${className}`}>
      {items.map((item) => (
        <li
          key={item}
          className="text-xs px-2.5 py-1 rounded-md border border-white/10 bg-white/[0.03] text-gray-300"
        >
          {item}
        </li>
      ))}
      {more && (
        <li className="text-xs px-2.5 py-1 rounded-md border border-dashed border-white/10 text-gray-400">
          + {more}
        </li>
      )}
    </ul>
  );
}
