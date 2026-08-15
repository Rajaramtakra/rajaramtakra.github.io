import { Helmet } from 'react-helmet-async'
import useFetch from '../hooks/useFetch'
import { getPageBySlug } from '../services/pageService'
import { getAcfImageUrl } from '../utils/wpHelpers'
import PageHero from '../components/PageHero'
import Container from '../components/Container'

export default function Academics() {
  const { data: page, loading } = useFetch(() => getPageBySlug('academics'), [])
  if (loading || !page) return null
  const acf = page.acf ?? {}

  return (
    <>
      <Helmet>
        <title>Academics — Khwopring English Secondary School</title>
        <meta name="description" content={acf.hero_subtitle || 'Our curriculum from Nursery through Grade 10 at Khwopring English Secondary School.'} />
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
    </>
  )
}
