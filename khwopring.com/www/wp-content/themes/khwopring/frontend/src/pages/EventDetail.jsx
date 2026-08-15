import { useParams, Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import useFetch from '../hooks/useFetch'
import { getEventBySlug } from '../services/eventService'
import { getFeaturedImageUrl, decodeHtml, formatDate, stripHtml } from '../utils/wpHelpers'
import Container from '../components/Container'
import ComingSoon from './ComingSoon'

export default function EventDetail() {
  const { slug } = useParams()
  const { data: event, loading } = useFetch(() => getEventBySlug(slug), [slug])

  if (loading) return null
  if (!event) return <ComingSoon title="Event Not Found" />

  const image = getFeaturedImageUrl(event, 'hero')

  return (
    <>
      <Helmet>
        <title>{decodeHtml(event.title.rendered)} — Khwopring English Secondary School</title>
        <meta name="description" content={stripHtml(event.content?.rendered)} />
      </Helmet>
      {image && <img src={image} alt={decodeHtml(event.title.rendered)} className="h-[40vh] w-full object-cover" />}
      <Container className="max-w-3xl py-16">
        <Link to="/events" className="mb-6 inline-block text-sm font-semibold text-rust hover:underline">
          ← Back to Events
        </Link>
        <p className="section-eyebrow mb-2">
          {formatDate(event.acf?.start_date)}
          {event.acf?.end_date && event.acf.end_date !== event.acf.start_date ? ` — ${formatDate(event.acf.end_date)}` : ''}
          {event.acf?.location ? ` · ${event.acf.location}` : ''}
        </p>
        <h1 className="mb-6 text-3xl md:text-4xl">{decodeHtml(event.title.rendered)}</h1>
        <div
          className="prose prose-neutral max-w-none text-navy/80 dark:prose-invert dark:text-cream-100/80"
          dangerouslySetInnerHTML={{ __html: event.content?.rendered ?? '' }}
        />
      </Container>
    </>
  )
}
