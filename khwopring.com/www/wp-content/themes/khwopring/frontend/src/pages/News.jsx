import { useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'
import useFetch from '../hooks/useFetch'
import { getNews } from '../services/newsService'
import { getFeaturedImageUrl, decodeHtml, formatDate } from '../utils/wpHelpers'
import PageHero from '../components/PageHero'
import Container from '../components/Container'
import Card from '../components/Card'
import Pagination from '../components/Pagination'

const PER_PAGE = 9

export default function News() {
  const [page, setPage] = useState(1)
  const { data, loading } = useFetch(() => getNews({ page, perPage: PER_PAGE }), [page])

  const items = data?.items ?? []
  const totalPages = Math.max(1, Math.ceil((data?.total ?? 0) / PER_PAGE))

  return (
    <>
      <Helmet>
        <title>News — Khwopring English Secondary School</title>
        <meta name="description" content="Latest news and announcements from Khwopring English Secondary School." />
      </Helmet>
      <PageHero title="News" subtitle="Updates and announcements from the school." />

      <section className="py-20">
        <Container>
          {!loading && items.length === 0 && (
            <p className="text-center text-navy/60 dark:text-cream-100/60">No news posted yet.</p>
          )}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((post, i) => (
              <Card key={post.id} delay={i * 0.06}>
                <Link to={`/news/${post.slug}`}>
                  <img
                    src={getFeaturedImageUrl(post, 'card')}
                    alt={decodeHtml(post.title.rendered)}
                    loading="lazy"
                    className="h-44 w-full object-cover"
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
          </div>
          <Pagination page={page} totalPages={totalPages} onChange={setPage} />
        </Container>
      </section>
    </>
  )
}
