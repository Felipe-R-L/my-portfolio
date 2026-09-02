import { useEffect, useState } from 'react'

export function ReadingProgress() {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const update = () => {
      const scrollable = document.documentElement.scrollHeight - window.innerHeight
      setProgress(scrollable <= 0 ? 0 : Math.min(100, (window.scrollY / scrollable) * 100))
    }
    update()
    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    return () => {
      window.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [])

  return (
    <div className="fixed top-0 inset-x-0 z-[60] h-[2px]" aria-hidden="true">
      <div
        className="h-full bg-gradient-to-r from-[var(--zone-a-1)] to-[var(--zone-a-2)]"
        style={{ width: `${progress}%` }}
      />
    </div>
  )
}
