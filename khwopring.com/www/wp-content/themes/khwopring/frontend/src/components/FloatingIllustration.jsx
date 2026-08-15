import { motion } from 'framer-motion'

/** Decorative illustration with a gentle up/down float loop. Hidden below lg since it's non-essential. */
export default function FloatingIllustration({ src, alt = '', className = '', width = 140 }) {
  if (!src) return null

  return (
    <motion.img
      src={src}
      alt={alt}
      width={width}
      animate={{ y: [0, -14, 0] }}
      transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      className={`pointer-events-none hidden select-none lg:block ${className}`}
    />
  )
}
