import { Helmet } from 'react-helmet-async'
import useFetch from '../hooks/useFetch'
import { getPageBySlug } from '../services/pageService'
import { getAdmissionNotices } from '../services/admissionService'
import { getAcfImageUrl, getFeaturedImageUrl, decodeHtml, formatDate } from '../utils/wpHelpers'
import PageHero from '../components/PageHero'
import Container from '../components/Container'
import Card from '../components/Card'
import ContactForm from '../components/ContactForm'
import Button from '../components/Button'

export default function Admission() {
  const { data: page, loading } = useFetch(() => getPageBySlug('admission'), [])
  const { data: notices } = useFetch(getAdmissionNotices, [])

  if (loading || !page) return null
  const acf = page.acf ?? {}

  return (
    <>
      <Helmet>
        <title>Admission — Khwopring English Secondary School</title>
        <meta name="description" content={acf.hero_subtitle || 'Admission information and enquiry form for Khwopring English Secondary School.'} />
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

      {notices?.length > 0 && (
        <section className="bg-cream-200 py-20 dark:bg-white/5">
          <Container>
            <h2 className="mb-8 text-2xl">Current Intake Notices</h2>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {notices.map((notice, i) => (
                <Card key={notice.id} delay={i * 0.08} className="flex gap-4 p-5">
                  {getFeaturedImageUrl(notice, 'thumbnail') && (
                    <img
                      src={getFeaturedImageUrl(notice, 'thumbnail')}
                      alt={decodeHtml(notice.title.rendered)}
                      className="h-20 w-20 shrink-0 rounded-lg object-cover"
                    />
                  )}
                  <div className="flex-1">
                    <h3 className="mb-1 font-semibold">{decodeHtml(notice.title.rendered)}</h3>
                    <div
                      className="mb-2 text-sm text-navy/70 dark:text-cream-100/70"
                      dangerouslySetInnerHTML={{ __html: notice.content?.rendered ?? '' }}
                    />
                    <p className="text-xs text-rust">
                      {notice.acf?.intake_year && `Intake ${notice.acf.intake_year}`}
                      {notice.acf?.deadline && ` · Deadline ${formatDate(notice.acf.deadline)}`}
                    </p>
                    {notice.acf?.button_link && (
                      <Button
                      to={notice.acf.button_link}
                      variant="outline"
                      className="mt-3 !text-navy !border-navy/30 dark:!text-cream-100 dark:!border-cream-100/30"
                    >
                        Learn More
                      </Button>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </Container>
        </section>
      )}

      <section className="py-20">
        <Container className="max-w-2xl">
          <h2 className="mb-6 text-2xl">Enquire About Admission</h2>
          <ContactForm defaultSubject="Admission Inquiry" />
        </Container>
      </section>
    </>
  )
}
