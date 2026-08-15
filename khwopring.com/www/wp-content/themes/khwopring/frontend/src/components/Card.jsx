import { motion } from 'framer-motion'

export default function Card({ children, className = '', delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.5, delay }}
      className={`bg-white dark:bg-navy-800 rounded-xl shadow-card overflow-hidden ${className}`}
    >
      {children}
    </motion.div>
  )
}
