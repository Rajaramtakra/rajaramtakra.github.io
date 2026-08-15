import { useCallback, useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import useFetch from '../hooks/useFetch'
import { getHeroSlides } from '../services/homeService'
import { getFeaturedImageUrl, getAcfImageUrl, decodeHtml } from '../utils/wpHelpers'
import Button from '../components/Button'

const AUTOPLAY_DELAY = 6000

export default function HeroSlider() {
  const { data: slides, loading } = useFetch(getHeroSlides, [])
  const [index, setIndex] = useState(0)
  const count = slides?.length ?? 0

  const goTo = useCallback((i) => setIndex(((i % count) + count) % count), [count])

  useEffect(() => {
    if (count <= 1) return
    const timer = setInterval(() => setIndex((i) => (i + 1) % count), AUTOPLAY_DELAY)
    return () => clearInterval(timer)
  }, [count])

  if (loading) {
    return <div className="h-[70vh] min-h-[520px] w-full animate-pulse bg-navy/10" />
  }

  if (!count) return null

  const safeIndex = index < count ? index : 0
  const slide = slides[safeIndex]
  const bg = getAcfImageUrl(slide.acf?.background_image, 'hero') ?? getFeaturedImageUrl(slide, 'hero')

  return (
    <section className="relative h-[70vh] min-h-[520px] w-full overflow-hidden bg-navy-900">
      <AnimatePresence>
        <motion.div
          key={slide.id}
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: bg ? `url(${bg})` : undefined }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.9, ease: 'easeInOut' }}
        />
      </AnimatePresence>

      <div className="absolute inset-0 bg-navy-900/45" />

      {decodeHtml(slide.title.rendered) && (
        <div className="container relative mx-auto flex h-full items-end px-4 pb-16 md:items-center md:pb-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={slide.id}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.5 }}
              className="max-w-xl text-white"
            >
              {slide.acf?.subtitle && (
                <p className="mb-1 font-display text-xl font-light text-white/90 md:text-2xl">{slide.acf.subtitle}</p>
              )}
              <h1 className="font-display text-3xl font-bold leading-tight md:text-5xl">
                {decodeHtml(slide.title.rendered)}
              </h1>
              {slide.acf?.description && <p className="mt-4 text-white/85 md:text-lg">{slide.acf.description}</p>}
              {slide.acf?.button_text && (
                <Button to={slide.acf.button_link || '/'} variant="primary" className="mt-6 inline-flex">
                  {slide.acf.button_text}
                </Button>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      )}

      {count > 1 && (
        <>
          <button
            type="button"
            aria-label="Previous slide"
            onClick={() => goTo(safeIndex - 1)}
            className="absolute left-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/15 p-2 text-white backdrop-blur transition hover:bg-white/30 md:left-6 md:p-3"
          >
            <ChevronIcon direction="left" />
          </button>
          <button
            type="button"
            aria-label="Next slide"
            onClick={() => goTo(safeIndex + 1)}
            className="absolute right-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/15 p-2 text-white backdrop-blur transition hover:bg-white/30 md:right-6 md:p-3"
          >
            <ChevronIcon direction="right" />
          </button>

          <div className="absolute bottom-5 left-1/2 z-10 flex -translate-x-1/2 gap-2">
            {slides.map((s, i) => (
              <button
                key={s.id}
                type="button"
                aria-label={`Go to slide ${i + 1}`}
                onClick={() => goTo(i)}
                className={`h-2 rounded-full transition-all ${
                  i === safeIndex ? 'w-6 bg-gold' : 'w-2 bg-white/50 hover:bg-white/80'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  )
}

function ChevronIcon({ direction }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path
        d={direction === 'left' ? 'M15 6l-6 6 6 6' : 'M9 6l6 6-6 6'}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
