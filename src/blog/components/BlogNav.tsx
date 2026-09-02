import { useTranslation } from 'react-i18next'
import { GlassNav, type GlassNavItem } from '../../app/components/shared/GlassNav'

const SECTION_IDS = ['about', 'projects', 'experience', 'services'] as const

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'pt', label: 'Português' },
] as const

export function BlogNav() {
  const { t, i18n } = useTranslation()

  const items: GlassNavItem[] = [
    ...SECTION_IDS.map((id) => ({ id, href: `/#${id}`, label: t(`nav.${id}`) })),
    { id: 'blog', href: '/blog', label: t('nav.blog') },
  ]

  return (
    <GlassNav
      items={items}
      languages={LANGUAGES}
      activeLanguage={i18n.language}
      onLanguageChange={(code) => i18n.changeLanguage(code)}
      openLabel={t('nav.menu_open')}
      closeLabel={t('nav.menu_close')}
      entrance={{ duration: 0.6, delay: 0 }}
    />
  )
}
