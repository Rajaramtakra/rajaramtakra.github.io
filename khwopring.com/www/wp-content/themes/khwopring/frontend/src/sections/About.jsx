import { motion } from 'framer-motion'
import useFetch from '../hooks/useFetch'
import { getHomePageContent, getPrincipalMessage } from '../services/homeService'
import { getAcfImageUrl, getFeaturedImageUrl, decodeHtml } from '../utils/wpHelpers'
import Container from '../components/Container'
import FloatingIllustration from '../components/FloatingIllustration'

export default function About() {
  const { data: page, loading } = useFetch(getHomePageContent, [])
  const { data: principal } = useFetch(getPrincipalMessage, [])

  if (loading || !page) return null
  const acf = page.acf ?? {}

  return (
    <section className="relative py-20">
      <FloatingIllustration
        src={getAcfImageUrl(acf.decoration_image)}
        alt=""
        className="absolute -bottom-6 left-2 z-10"
      />
      <Container className="grid grid-cols-1 items-center gap-12 md:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6 }}
        >
          <p className="section-eyebrow mb-2">About Us</p>
          <h2 className="mb-4 text-2xl md:text-3xl">{acf.about_title}</h2>
          <div
            className="prose prose-neutral mb-6 max-w-none text-navy/80 dark:prose-invert dark:text-cream-100/80"
            dangerouslySetInnerHTML={{ __html: acf.about_text ?? '' }}
          />
          
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6 }}
        >
          {acf.about_image && (
            <img
              src={getAcfImageUrl(acf.about_image, 'card')}
              alt={decodeHtml(page.title.rendered)}
              className="w-full rounded-2xl object-cover shadow-card"
              loading="lazy"
            />
          )}
          {principal && (
            <div className="flex items-center gap-4 border-t border-cream-300 pt-6">
              {getFeaturedImageUrl(principal) && (
                <img
                  src={getFeaturedImageUrl(principal, 'thumbnail')}
                  alt={decodeHtml(principal.title.rendered)}
                  className="h-14 w-14 rounded-full object-cover"
                />
              )}
              <div>
                <p className="text-sm uppercase tracking-wide text-rust">Principal&rsquo;s Note</p>
                <p className="font-display font-semibold">
                  — {decodeHtml(principal.title.rendered)}, {principal.acf?.designation}
                </p>
              </div>
            </div>
          )}
        </motion.div>
      </Container>
    </section>
  )
}
