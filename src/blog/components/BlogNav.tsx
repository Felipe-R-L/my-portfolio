import { motion } from 'motion/react'
import { useTranslation } from 'react-i18next'

const NAV_ITEMS = [
  { href: '/#about', key: 'nav.about' },
  { href: '/#projects', key: 'nav.projects' },
  { href: '/#experience', key: 'nav.experience' },
  { href: '/#services', key: 'nav.services' },
  { href: '/blog', key: 'nav.blog' },
] as const

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'pt', label: 'Português' },
] as const

export function BlogNav() {
  const { t, i18n } = useTranslation()

  return (
    <motion.nav
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="fixed top-4 md:top-6 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-1.5rem)] md:w-max rounded-[40px] shadow-[0_8px_32px_rgba(0,0,0,0.5)]"
    >
      <div className="rounded-[40px] border border-white/[0.14] bg-white/[0.06] backdrop-blur-2xl backdrop-saturate-150 px-4 md:px-8 py-2.5 md:py-3 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.16)]">
        <div className="flex items-center gap-3 md:gap-8">
          <div className="flex items-center gap-3 md:gap-8">
            {NAV_ITEMS.map((item) => (
              <a
                key={item.key}
                href={item.href}
                className="group relative whitespace-nowrap text-[9px] md:text-xs font-medium uppercase tracking-[0.05em] md:tracking-[0.2em] text-white/60 transition-colors hover:text-white"
              >
                {t(item.key)}
                <span className="absolute -bottom-1 left-0 h-[1px] w-0 bg-gradient-to-r from-[var(--zone-a-1)] to-[var(--zone-a-2)] transition-all duration-300 group-hover:w-full" />
              </a>
            ))}
          </div>

          <div className="flex h-4 items-center gap-1.5 md:gap-3 border-l border-white/10 pl-3 md:pl-6">
            {LANGUAGES.map((lang) => {
              const isActive = i18n.language.startsWith(lang.code)
              return (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => i18n.changeLanguage(lang.code)}
                  lang={lang.code}
                  title={lang.label}
                  aria-pressed={isActive}
                  className={`text-[9px] md:text-[10px] font-bold uppercase tracking-widest transition-all duration-300 ${
                    isActive ? 'text-[var(--zone-a-1)]' : 'text-white/50 hover:text-white/80'
                  }`}
                >
                  {lang.code}
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </motion.nav>
  )
}
