export interface NavLink {
  label: string
  id: string
}

const defaultNavLinks: NavLink[] = [
  { label: 'Testimonials', id: 'testimonials' },
  { label: 'Features', id: 'features' },
  { label: 'How it works', id: 'how-it-works' },
  { label: 'FAQ', id: 'faq' },
]

export function useSiteNavigation() {
  const route = useRoute()
  const router = useRouter()

  function scrollToSection(id: string) {
    if (import.meta.client) {
      if (route.path === '/') {
        const el = document.getElementById(id)
        if (!el) return
        const headerOffset = 80
        const top = el.getBoundingClientRect().top + window.scrollY - headerOffset
        window.scrollTo({ top, behavior: 'smooth' })
        return
      }

      router.push({ path: '/', hash: `#${id}` })
    }
  }

  return {
    navLinks: defaultNavLinks,
    scrollToSection,
  }
}
