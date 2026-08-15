import { Link } from 'react-router-dom'
import useFetch from '../hooks/useFetch'
import { getNews } from '../services/newsService'
import { getEvents } from '../services/eventService'
import { getHomePageContent } from '../services/homeService'
import { getAcfImageUrl, getFeaturedImageUrl, decodeHtml, formatDate } from '../utils/wpHelpers'
import Container from '../components/Container'
import Card from '../components/Card'
import SectionHeading from '../components/SectionHeading'
import FloatingIllustration from '../components/FloatingIllustration'

export default function NewsEvents() {
  const { data: news } = useFetch(() => getNews({ perPage: 2 }), [])
  const { data: events } = useFetch(() => getEvents({ perPage: 1 }), [])
  const { data: page } = useFetch(getHomePageContent, [])

  const newsItems = news?.items ?? []
  const featuredEvent = events?.items?.[0]

  if (!newsItems.length && !featuredEvent) return null

  return (
    <section className="relative py-20">
      <FloatingIllustration
        src={getAcfImageUrl(page?.acf?.decoration_image)}
        alt=""
        className="absolute -top-6 right-4 z-10 scale-x-[-1]"
      />
      <Container>
        <SectionHeading
          eyebrow="From the School"
          title="News & Upcoming Events"
          action={
            <Link to="/news" className="font-semibold text-rust hover:underline">
              View all news →
            </Link>
          }
        />
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {newsItems.map((post, i) => (
            <Card key={post.id} delay={i * 0.1}>
              <Link to={`/news/${post.slug}`}>
                <img
                  src={getFeaturedImageUrl(post, 'card')}
                  alt={decodeHtml(post.title.rendered)}
                  loading="lazy"
                  className="h-40 w-full object-cover"
                />
                <div className="p-5">
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-rust">
                    {formatDate(post.date)}
                  </p>
                  <h3 className="mb-2 font-semibold leading-snug">{decodeHtml(post.title.rendered)}</h3>
                  <p
                    className="line-clamp-2 text-sm text-navy/70 dark:text-cream-100/70"
                    dangerouslySetInnerHTML={{ __html: post.excerpt?.rendered ?? '' }}
                  />
                </div>
              </Link>
            </Card>
          ))}

          {featuredEvent && (
            <Card className="!bg-navy-900 !text-white">
              <div className="flex h-full flex-col justify-between p-6">
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gold">Upcoming</p>
                  <h3 className="mb-2 font-semibold leading-snug text-white">{decodeHtml(featuredEvent.title.rendered)}</h3>
                  <p className="text-sm text-cream-200/80">
                    {formatDate(featuredEvent.acf?.start_date)} — {featuredEvent.acf?.location}
                  </p>
                </div>
                <Link to={`/event/${featuredEvent.slug}`} className="mt-6 font-semibold text-gold hover:underline">
                  Check dates →
                </Link>
              </div>
            </Card>
          )}
        </div>
      </Container>
    </section>
  )
}
