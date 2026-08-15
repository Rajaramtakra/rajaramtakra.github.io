import useFetch from '../hooks/useFetch'
import { getHighlights } from '../services/highlightService'
import { getHomePageContent } from '../services/homeService'
import { getAcfImageUrl, getFeaturedImageUrl, decodeHtml } from '../utils/wpHelpers'
import Container from '../components/Container'
import Card from '../components/Card'
import FloatingIllustration from '../components/FloatingIllustration'

export default function WhyUs() {
  const { data: highlights, loading } = useFetch(getHighlights, [])
  const { data: page } = useFetch(getHomePageContent, [])

  if (loading || !highlights?.length) return null

  return (
    <section className="relative pt-16">
      <FloatingIllustration
        src={getAcfImageUrl(page?.acf?.decoration_image)}
        alt=""
        className="absolute -top-10 right-6 z-10"
      />
      <Container>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {highlights.map((item, i) => (
            <Card key={item.id} delay={i * 0.08}>
              <img
                src={getFeaturedImageUrl(item, 'card')}
                alt={decodeHtml(item.title.rendered)}
                loading="lazy"
                className="h-48 w-full object-cover"
              />
              <div className="p-6">
                <h3 className="mb-2 text-xl font-semibold">{decodeHtml(item.title.rendered)}</h3>
                <div
                  className="text-navy/70 dark:text-cream-100/70"
                  dangerouslySetInnerHTML={{ __html: item.content?.rendered ?? '' }}
                />
              </div>
            </Card>
          ))}
        </div>
      </Container>
    </section>
  )
}
