import { Helmet } from 'react-helmet-async'
import useFetch from '../hooks/useFetch'
import { getPageBySlug } from '../services/pageService'
import { getPrincipalMessage } from '../services/homeService'
import { getAchievements } from '../services/achievementService'
import { getTestimonials } from '../services/testimonialService'
import { getAcfImageUrl, getFeaturedImageUrl, decodeHtml } from '../utils/wpHelpers'
import PageHero from '../components/PageHero'
import Container from '../components/Container'
import Card from '../components/Card'
import SectionHeading from '../components/SectionHeading'

export default function About() {
  const { data: page, loading } = useFetch(() => getPageBySlug('about'), [])
  const { data: principal } = useFetch(getPrincipalMessage, [])
  const { data: achievements } = useFetch(getAchievements, [])
  const { data: testimonials } = useFetch(getTestimonials, [])

  if (loading || !page) return null
  const acf = page.acf ?? {}

  return (
    <>
      <Helmet>
        <title>About — Khwopring English Secondary School</title>
        <meta name="description" content={acf.hero_subtitle || 'Learn about Khwopring English Secondary School — our history, principal, and achievements.'} />
      </Helmet>
      <PageHero title={acf.hero_title} subtitle={acf.hero_subtitle} image={getAcfImageUrl(acf.hero_image, 'hero')} />

      <section className="py-20">
        <Container className="max-w-3xl">
          <div
            className="prose prose-neutral max-w-none text-navy/80 dark:prose-invert dark:text-cream-100/80"
            dangerouslySetInnerHTML={{ __html: acf.content_body ?? '' }}
          />
        </Container>
      </section>

      {principal && (
        <section className="bg-cream-200 py-20 dark:bg-white/5">
          <Container className="grid grid-cols-1 items-center gap-10 md:grid-cols-3">
            {getFeaturedImageUrl(principal) && (
              <img
                src={getFeaturedImageUrl(principal, 'card')}
                alt={decodeHtml(principal.title.rendered)}
                className="mx-auto h-56 w-56 rounded-full object-cover shadow-card"
              />
            )}
            <div className="md:col-span-2">
              <p className="section-eyebrow mb-2">Principal&rsquo;s Message</p>
              <div
                className="prose prose-neutral mb-4 max-w-none text-navy/80 dark:prose-invert dark:text-cream-100/80"
                dangerouslySetInnerHTML={{ __html: principal.content?.rendered ?? '' }}
              />
              <p className="font-display font-semibold text-navy dark:text-cream-100">
                — {decodeHtml(principal.title.rendered)}, {principal.acf?.designation}
              </p>
            </div>
          </Container>
        </section>
      )}

      {achievements?.length > 0 && (
        <section className="py-20">
          <Container>
            <SectionHeading eyebrow="Recognitions" title="Achievements" />
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              {achievements.map((item, i) => (
                <Card key={item.id} delay={i * 0.08} className="flex gap-4 p-5">
                  {getFeaturedImageUrl(item, 'thumbnail') && (
                    <img
                      src={getFeaturedImageUrl(item, 'thumbnail')}
                      alt={decodeHtml(item.title.rendered)}
                      className="h-20 w-20 shrink-0 rounded-lg object-cover"
                    />
                  )}
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-rust">{item.acf?.year}</p>
                    <h3 className="mb-1 font-semibold">{decodeHtml(item.title.rendered)}</h3>
                    <div
                      className="text-sm text-navy/70 dark:text-cream-100/70"
                      dangerouslySetInnerHTML={{ __html: item.content?.rendered ?? '' }}
                    />
                  </div>
                </Card>
              ))}
            </div>
          </Container>
        </section>
      )}

      {testimonials?.length > 0 && (
        <section className="bg-navy-900 py-20 text-white">
          <Container>
            <SectionHeading eyebrow="What People Say" title={<span className="text-white">Testimonials</span>} />
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {testimonials.map((t, i) => (
                <Card key={t.id} delay={i * 0.1} className="!bg-white/5 p-6">
                  <div
                    className="mb-4 text-cream-200/90"
                    dangerouslySetInnerHTML={{ __html: t.content?.rendered ?? '' }}
                  />
                  <p className="font-semibold text-gold">
                    {decodeHtml(t.title.rendered)}
                    {t.acf?.role && <span className="font-normal text-cream-200/70"> — {t.acf.role}</span>}
                  </p>
                </Card>
              ))}
            </div>
          </Container>
        </section>
      )}
    </>
  )
}
