import { motion } from 'framer-motion'

export default function SectionHeading({ eyebrow, title, action }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 mb-10">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: 0.5 }}
      >
        {eyebrow && <p className="section-eyebrow mb-2">{eyebrow}</p>}
        <h2 className="text-2xl md:text-3xl">{title}</h2>
      </motion.div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}
