import React, { useRef, useState, useEffect } from "react";
import { cn } from "../../utils/cn";

interface MobileCarouselProps {
  children: React.ReactNode[];
  className?: string;
  itemClassName?: string;
  showDots?: boolean;
  containerClassName?: string;
}

export default function MobileCarousel({
  children,
  className,
  itemClassName,
  showDots = true,
  containerClassName,
}: MobileCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      if (scrollRef.current) {
        const { scrollLeft, clientWidth } = scrollRef.current;
        // Calculate based on children length and scroll position
        const maxScroll = scrollRef.current.scrollWidth - clientWidth;
        const scrollFraction = scrollLeft / maxScroll;
        const index = Math.min(
          children.length - 1,
          Math.max(0, Math.round(scrollLeft / (scrollRef.current.scrollWidth / children.length)))
        );
        setActiveIndex(index);
      }
    };

    const scrollContainer = scrollRef.current;
    if (scrollContainer) {
      scrollContainer.addEventListener("scroll", handleScroll, { passive: true });
      return () => scrollContainer.removeEventListener("scroll", handleScroll);
    }
  }, [children.length]);

  const scrollTo = (index: number) => {
    if (scrollRef.current) {
      const itemWidth = scrollRef.current.scrollWidth / children.length;
      scrollRef.current.scrollTo({
        left: index * itemWidth,
        behavior: "smooth",
      });
    }
  };

  return (
    <div className={cn("relative w-full overflow-hidden", containerClassName)}>
      <div
        ref={scrollRef}
        className={cn(
          "flex overflow-x-auto snap-x snap-mandatory no-scrollbar gap-4 px-4 py-8",
          className
        )}
        style={{ 
          scrollbarWidth: "none", 
          msOverflowStyle: "none",
          WebkitOverflowScrolling: "touch"
        }}
      >
        {children.map((child, idx) => (
          <div
            key={idx}
            className={cn("flex-shrink-0 w-[85vw] snap-center", itemClassName)}
          >
            {child}
          </div>
        ))}
      </div>

      {showDots && children.length > 1 && (
        <div className="flex justify-center gap-2 mt-2 pb-4">
          {children.map((_, idx) => (
            <button
              key={idx}
              onClick={() => scrollTo(idx)}
              className={cn(
                "h-1.5 rounded-full transition-all duration-300",
                activeIndex === idx ? "bg-blue-500 w-8" : "bg-white/20 w-4"
              )}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
