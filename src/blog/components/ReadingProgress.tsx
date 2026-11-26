import { useEffect, useRef } from 'react'

/** A thin line at the top that fills as the article is read. */
export function ReadingProgress() {
  const barRef = useRef<HTMLElement>(null)

  useEffect(() => {
    let raf = 0
    const update = () => {
      raf = 0
      const scrollable = document.documentElement.scrollHeight - window.innerHeight
      const p = scrollable <= 0 ? 0 : Math.min(1, window.scrollY / scrollable)
      if (barRef.current) barRef.current.style.transform = `scaleX(${p.toFixed(4)})`
    }
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(update)
    }
    update()
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
    }
  }, [])

  return (
    <div className="blog-progress" aria-hidden="true">
      <i ref={barRef} style={{ transform: 'scaleX(0)' }} />
    </div>
  )
}
