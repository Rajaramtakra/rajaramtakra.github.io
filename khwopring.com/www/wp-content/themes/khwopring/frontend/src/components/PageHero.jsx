import { motion } from 'framer-motion'
import Container from './Container'

export default function PageHero({ title, subtitle, image }) {
  return (
    <section
      className="relative flex h-[42vh] min-h-[280px] items-center bg-navy-900 bg-cover bg-center text-white"
      style={image ? { backgroundImage: `url(${image})` } : undefined}
    >
      <div className="absolute inset-0 bg-navy-900/70" />
      <Container className="relative"> 
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-3xl font-bold md:text-5xl">{title}</h1>
          {subtitle && <p className="mt-3 max-w-xl text-cream-200/85 md:text-lg">{subtitle}</p>}
        </motion.div>
      </Container>
    </section>
  )
}
