import { Helmet } from 'react-helmet-async'
import useFetch from '../hooks/useFetch'
import { getPageBySlug } from '../services/pageService'
import { getFaqs } from '../services/faqService'
import { decodeHtml } from '../utils/wpHelpers'
import PageHero from '../components/PageHero'
import Container from '../components/Container'
import Accordion from '../components/Accordion'

export default function Faq() {
  const { data: page } = useFetch(() => getPageBySlug('faq'), [])
  const { data: faqs, loading } = useFetch(getFaqs, [])
  const acf = page?.acf ?? {}

  const items = (faqs ?? []).map((item) => ({
    id: item.id,
    question: decodeHtml(item.title.rendered),
    answer: item.content?.rendered ?? '',
  }))

  return (
    <>
      <Helmet>
        <title>FAQ — Khwopring English Secondary School</title>
        <meta name="description" content={acf.hero_subtitle || 'Answers to frequently asked questions about Khwopring English Secondary School.'} />
      </Helmet>
      <PageHero
        title={acf.hero_title || 'Frequently Asked Questions'}
        subtitle={acf.hero_subtitle}
      />
      <section className="py-20">
        <Container className="max-w-2xl">
          {!loading && items.length === 0 && (
            <p className="text-center text-navy/60 dark:text-cream-100/60">No FAQs added yet.</p>
          )}
          {items.length > 0 && <Accordion items={items} />}
        </Container>
      </section>
    </>
  )
}
