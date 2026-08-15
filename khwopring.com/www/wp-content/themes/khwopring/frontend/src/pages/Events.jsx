import { useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'
import useFetch from '../hooks/useFetch'
import { getEvents } from '../services/eventService'
import { getFeaturedImageUrl, decodeHtml, formatDate } from '../utils/wpHelpers'
import PageHero from '../components/PageHero'
import Container from '../components/Container'
import Card from '../components/Card'
import Pagination from '../components/Pagination'

const PER_PAGE = 9

export default function Events() {
  const [page, setPage] = useState(1)
  const { data, loading } = useFetch(() => getEvents({ page, perPage: PER_PAGE }), [page])

  const items = data?.items ?? []
  const totalPages = Math.max(1, Math.ceil((data?.total ?? 0) / PER_PAGE))

  return (
    <>
      <Helmet>
        <title>Events — Khwopring English Secondary School</title>
        <meta name="description" content="Upcoming and past events at Khwopring English Secondary School." />
      </Helmet>
      <PageHero title="Events" subtitle="What's happening on and off campus." />

      <section className="py-20">
        <Container>
          {!loading && items.length === 0 && (
            <p className="text-center text-navy/60 dark:text-cream-100/60">No events scheduled yet.</p>
          )}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((event, i) => (
              <Card key={event.id} delay={i * 0.06}>
                <Link to={`/event/${event.slug}`}>
                  <img
                    src={getFeaturedImageUrl(event, 'card')}
                    alt={decodeHtml(event.title.rendered)}
                    loading="lazy"
                    className="h-44 w-full object-cover"
                  />
                  <div className="p-5">
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-rust">
                      {formatDate(event.acf?.start_date)}
                      {event.acf?.location ? ` — ${event.acf.location}` : ''}
                    </p>
                    <h3 className="font-semibold leading-snug">{decodeHtml(event.title.rendered)}</h3>
                  </div>
                </Link>
              </Card>
            ))}
          </div>
          <Pagination page={page} totalPages={totalPages} onChange={setPage} />
        </Container>
      </section>
    </>
  )
}
