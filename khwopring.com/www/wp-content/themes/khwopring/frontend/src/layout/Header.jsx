import { useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { useSiteSettings } from '../context/SiteSettingsContext'
import Container from '../components/Container'
import SearchOverlay from '../components/SearchOverlay'

function NavItem({ item }) {
  const hasChildren = item.children?.length > 0
  const isMega = hasChildren && item.children.length > 4

  return (
    <li className="relative group">
      <NavLink
        to={item.url}
        className={({ isActive }) =>
          `flex items-center gap-1 py-2 font-medium transition-colors hover:text-rust ${
            isActive ? 'text-rust' : 'text-navy dark:text-cream-100'
          }`
        }
      >
        {item.title}
        {hasChildren && <span aria-hidden="true">▾</span>}
      </NavLink>

      {hasChildren && (
        <div
          className={`invisible absolute left-0 top-full z-40 rounded-lg bg-white opacity-0 shadow-card transition-all duration-200 group-hover:visible group-hover:opacity-100 dark:bg-navy-800 ${
            isMega ? 'grid w-[560px] grid-cols-2 gap-2 p-4' : 'w-56 py-2'
          }`}
        >
          {item.children.map((child) => (
            <NavLink
              key={child.id}
              to={child.url}
              className="block rounded px-4 py-2 text-sm text-navy hover:bg-cream-200 dark:text-cream-100 dark:hover:bg-white/10"
            >
              {child.title}
            </NavLink>
          ))}
        </div>
      )}
    </li>
  )
}

export default function Header() {
  const { settings, menu } = useSiteSettings()
  const [offcanvasOpen, setOffcanvasOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)

  useEffect(() => {
    document.body.style.overflow = offcanvasOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [offcanvasOpen])

  return (
    <header className="sticky top-0 z-50 bg-white shadow-sm dark:bg-navy-900">
      {/* Top bar */}
      <div className="hidden bg-navy text-cream-100 md:block">
        <Container className="flex items-center justify-between py-2 text-sm">
          <div className="flex items-center gap-4">
            {settings?.phone && <a href={`tel:${settings.phone}`}>{settings.phone}</a>}
            {settings?.email && <a href={`mailto:${settings.email}`}>{settings.email}</a>}
          </div>
          <div>{settings?.office_hours}</div>
        </Container>
      </div>

      {/* Main nav */}
      <Container className="flex items-center justify-between py-3">
        <NavLink to="/" className="flex items-center gap-2">
          {settings?.logo_url ? (
            <img src={settings.logo_url} alt="Khwopring" className="h-10 w-auto" />
          ) : (
            <span className="font-display text-xl font-bold text-navy dark:text-cream-100">Khwopring</span>
          )}
        </NavLink>

        <nav className="hidden lg:block">
          <ul className="flex items-center gap-8">
            {menu.map((item) => (
              <NavItem key={item.id} item={item} />
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-3">
          <button
            aria-label="Search"
            onClick={() => setSearchOpen(true)}
            className="rounded-full p-2 text-navy hover:bg-cream-200 dark:text-cream-100 dark:hover:bg-white/10"
          >
            <SearchIcon />
          </button>
          {settings?.erp_link && (
            <a
              href={settings.erp_link}
              target="_blank"
              rel="noreferrer"
              className="hidden rounded-md bg-rust px-4 py-2 text-sm font-semibold text-white hover:bg-rust-700 lg:block"
            >
              {settings.erp_label ?? 'ERP'}
            </a>
          )}
          <button
            aria-label="Open menu"
            className="rounded-md p-2 text-navy hover:bg-cream-200 dark:text-cream-100 dark:hover:bg-white/10 lg:hidden"
            onClick={() => setOffcanvasOpen(true)}
          >
            <MenuIcon />
          </button>
        </div>
      </Container>

      {/* Offcanvas mobile menu */}
      <AnimatePresence>
        {offcanvasOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-50 bg-navy-900/50 lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOffcanvasOpen(false)}
            />
            <motion.aside
              className="fixed inset-y-0 right-0 z-50 w-80 max-w-[85vw] overflow-y-auto bg-white p-6 dark:bg-navy-900 lg:hidden"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.25 }}
            >
              <div className="mb-6 flex items-center justify-between">
                <span className="font-display text-lg font-bold text-navy dark:text-cream-100">Menu</span>
                <button
                  aria-label="Close menu"
                  className="text-navy dark:text-cream-100"
                  onClick={() => setOffcanvasOpen(false)}
                >
                  <CloseIcon />
                </button>
              </div>
              <ul className="flex flex-col gap-1">
                {menu.map((item) => (
                  <li key={item.id}>
                    <NavLink
                      to={item.url}
                      onClick={() => setOffcanvasOpen(false)}
                      className={({ isActive }) =>
                        `block rounded-md px-3 py-2 font-medium ${
                          isActive ? 'bg-cream-200 text-rust dark:bg-white/10' : 'text-navy dark:text-cream-100'
                        }`
                      }
                    >
                      {item.title}
                    </NavLink>
                    {item.children?.length > 0 && (
                      <ul className="ml-3 border-l border-cream-300 pl-3 dark:border-white/10">
                        {item.children.map((child) => (
                          <li key={child.id}>
                            <NavLink
                              to={child.url}
                              onClick={() => setOffcanvasOpen(false)}
                              className="block rounded-md px-3 py-2 text-sm text-navy/80 dark:text-cream-100/80"
                            >
                              {child.title}
                            </NavLink>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                ))}
              </ul>
              {settings?.erp_link && (
                <a
                  href={settings.erp_link}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-6 block rounded-md bg-rust px-4 py-3 text-center font-semibold text-white"
                >
                  {settings.erp_label ?? 'ERP'}
                </a>
              )}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
    </header>
  )
}

function MenuIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
    </svg>
  )
}

function SearchIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.3-4.3" strokeLinecap="round" />
    </svg>
  )
}
