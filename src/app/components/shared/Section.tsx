import React from "react";
import { cn } from "../../utils/cn";

/**
 * Every section shares one container and one vertical rhythm, so the left edge
 * of the content stops shifting between sections and the space between them
 * becomes a deliberate value instead of a repeated `py-32`.
 */
export function Section({
  id,
  className,
  children,
}: {
  id?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className={cn("section-shell relative z-10", className)}>
      <div className="measure relative">{children}</div>
    </section>
  );
}
