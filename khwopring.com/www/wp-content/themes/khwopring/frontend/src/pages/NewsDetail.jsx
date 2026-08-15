import { useParams, Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import useFetch from '../hooks/useFetch'
import { getNewsBySlug } from '../services/newsService'
import { getFeaturedImageUrl, decodeHtml, formatDate, stripHtml } from '../utils/wpHelpers'
import Container from '../components/Container'
import ComingSoon from './ComingSoon' 

export default function NewsDetail() {
  const { slug } = useParams()
  const { data: post, loading } = useFetch(() => getNewsBySlug(slug), [slug])

  if (loading) return null
  if (!post) return <ComingSoon title="News Article Not Found" />

  const image = getFeaturedImageUrl(post, 'hero')

  return (
    <>
      <Helmet>
        <title>{decodeHtml(post.title.rendered)} — Khwopring English Secondary School</title>
        <meta name="description" content={stripHtml(post.excerpt?.rendered ?? post.content?.rendered)} />
      </Helmet>
      {image && <img src={image} alt={decodeHtml(post.title.rendered)} className="h-[40vh] w-full object-cover" />}
      <Container className="max-w-3xl py-16">
        <Link to="/news" className="mb-6 inline-block text-sm font-semibold text-rust hover:underline">
          ← Back to News
        </Link>
        <p className="section-eyebrow mb-2">{formatDate(post.date)}</p>
        <h1 className="mb-6 text-3xl md:text-4xl">{decodeHtml(post.title.rendered)}</h1>
        <div
          className="prose prose-neutral max-w-none text-navy/80 dark:prose-invert dark:text-cream-100/80"
          dangerouslySetInnerHTML={{ __html: post.content?.rendered ?? '' }}
        />
      </Container>
    </>
  )
}
