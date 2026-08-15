import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import useDebouncedValue from '../hooks/useDebouncedValue'
import useFetch from '../hooks/useFetch'
import { search } from '../services/searchService'

export default function SearchOverlay({ open, onClose }) {
  const [query, setQuery] = useState('')
  const debouncedQuery = useDebouncedValue(query, 300)
  const inputRef = useRef(null)
  const navigate = useNavigate()

  const { data: results, loading } = useFetch(() => search(debouncedQuery), [debouncedQuery])

  useEffect(() => {
    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- clearing the field each time the overlay opens
      setQuery('')
      requestAnimationFrame(() => inputRef.current?.focus())
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    function handleKeyDown(e) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])

  function goTo(url) {
    onClose()
    navigate(url)
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-start justify-center bg-navy-900/60 px-4 pt-24 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Site search"
            className="w-full max-w-xl overflow-hidden rounded-xl bg-white shadow-card dark:bg-navy-800"
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 border-b border-cream-300 px-5 py-4 dark:border-white/10">
              <SearchIcon />
              <input
                ref={inputRef}
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search news, events, facilities, team…"
                className="w-full bg-transparent text-navy placeholder:text-navy/40 focus:outline-none dark:text-cream-100 dark:placeholder:text-cream-100/40"
              />
              <button aria-label="Close search" onClick={onClose} className="text-navy/60 dark:text-cream-100/60">
                <CloseIcon />
              </button>
            </div>

            <div className="max-h-[60vh] overflow-y-auto">
              {query.trim() === '' && (
                <p className="px-5 py-8 text-center text-sm text-navy/50 dark:text-cream-100/50">
                  Start typing to search the site.
                </p>
              )}

              {query.trim() !== '' && loading && (
                <p className="px-5 py-8 text-center text-sm text-navy/50 dark:text-cream-100/50">Searching…</p>
              )}

              {query.trim() !== '' && !loading && results?.length === 0 && (
                <p className="px-5 py-8 text-center text-sm text-navy/50 dark:text-cream-100/50">
                  No results for “{query}”.
                </p>
              )}

              {results?.length > 0 && (
                <ul>
                  {results.map((result) => (
                    <li key={`${result.type}-${result.id}`}>
                      <button
                        onClick={() => goTo(result.url)}
                        className="flex w-full flex-col gap-0.5 px-5 py-3 text-left hover:bg-cream-200 dark:hover:bg-white/10"
                      >
                        <span className="flex items-center gap-2">
                          <span className="rounded-full bg-rust/10 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-rust">
                            {result.typeLabel}
                          </span>
                          <span className="font-medium text-navy dark:text-cream-100">{result.title}</span>
                        </span>
                        {result.excerpt && (
                          <span className="line-clamp-1 text-sm text-navy/60 dark:text-cream-100/60">
                            {result.excerpt}
                          </span>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function SearchIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 text-navy/50 dark:text-cream-100/50">
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.3-4.3" strokeLinecap="round" />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
    </svg>
  )
}
