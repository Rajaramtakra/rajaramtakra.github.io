import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

export default function Lightbox({ images = [], index, onClose, onNext, onPrev }) {
  const isOpen = index != null && images[index]
  const hasMultiple = images.length > 1

  useEffect(() => {
    if (!isOpen) return

    function handleKeyDown(e) {
      if (e.key === 'Escape') onClose()
      if (hasMultiple && e.key === 'ArrowRight') onNext()
      if (hasMultiple && e.key === 'ArrowLeft') onPrev()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, hasMultiple, onClose, onNext, onPrev])

  const current = isOpen ? images[index] : null

  return (
    <AnimatePresence>
      {current && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-navy-900/90 p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <button
            aria-label="Close"
            className="absolute right-6 top-6 text-3xl text-white/80 hover:text-white"
            onClick={onClose}
          >
            ×
          </button>

          {hasMultiple && (
            <button
              aria-label="Previous image"
              className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full p-2 text-4xl text-white/80 hover:text-white sm:left-6"
              onClick={(e) => {
                e.stopPropagation()
                onPrev()
              }}
            >
              ‹
            </button>
          )}

          <motion.img
            key={current.src}
            src={current.src}
            alt={current.alt}
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="max-h-full max-w-full rounded-lg object-contain"
            onClick={(e) => e.stopPropagation()}
          />

          {hasMultiple && (
            <button
              aria-label="Next image"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-2 text-4xl text-white/80 hover:text-white sm:right-6"
              onClick={(e) => {
                e.stopPropagation()
                onNext()
              }}
            >
              ›
            </button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
