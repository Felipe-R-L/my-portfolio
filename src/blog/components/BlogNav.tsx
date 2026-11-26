import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, Moon, Sun } from 'lucide-react'

const LANGUAGES = [
  { code: 'pt', label: 'PT', name: 'Português' },
  { code: 'en', label: 'EN', name: 'English' },
] as const

const THEME_KEY = 'blog-theme'

/** The reader's choice, else the system's. blog.html applies the stored choice before paint. */
function isDark() {
  const forced = document.documentElement.dataset.theme
  if (forced) return forced === 'dark'
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false
}

function useTheme() {
  const [dark, setDark] = useState(() => (typeof document === 'undefined' ? false : isDark()))
  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-color-scheme: dark)')
    const sync = () => setDark(isDark())
    mq?.addEventListener('change', sync)
    return () => mq?.removeEventListener('change', sync)
  }, [])
  const toggle = () => {
    const next = isDark() ? 'light' : 'dark'
    document.documentElement.dataset.theme = next
    try {
      localStorage.setItem(THEME_KEY, next)
    } catch {
      // private window or blocked storage: the choice lasts for this page only
    }
    setDark(next === 'dark')
  }
  return { dark, toggle }
}

/** The top of every blog page: the way back, the language and the theme. */
export function BlogNav({ kind }: { kind: 'index' | 'article' }) {
  const { t, i18n } = useTranslation()
  const { dark, toggle } = useTheme()
  const lang = i18n.language?.startsWith('pt') ? 'pt' : 'en'

  return (
    <header className="blog-top">
      <a className="blog-back" href={kind === 'article' ? '/blog' : '/'}>
        <ArrowLeft size={18} aria-hidden="true" />
        {kind === 'article' ? t('blog.back') : t('blog.home')}
      </a>
      <div className="blog-tools">
        <div className="blog-lang" role="group" aria-label={t('blog.language')}>
          {LANGUAGES.map((l) => (
            <button
              key={l.code}
              type="button"
              lang={l.code}
              aria-label={l.name}
              aria-pressed={lang === l.code}
              onClick={() => i18n.changeLanguage(l.code)}
            >
              {l.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          className="blog-theme"
          onClick={toggle}
          aria-label={dark ? t('blog.theme_light') : t('blog.theme_dark')}
        >
          {dark ? <Sun size={18} aria-hidden="true" /> : <Moon size={18} aria-hidden="true" />}
        </button>
      </div>
    </header>
  )
}
