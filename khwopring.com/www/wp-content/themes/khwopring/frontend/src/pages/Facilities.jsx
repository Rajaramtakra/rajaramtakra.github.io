import { Helmet } from 'react-helmet-async'
import useFetch from '../hooks/useFetch'
import { getFacilities } from '../services/facilityService'
import { getFeaturedImageUrl, decodeHtml } from '../utils/wpHelpers'
import PageHero from '../components/PageHero'
import Container from '../components/Container'
import Card from '../components/Card'

export default function Facilities() {
  const { data: facilities, loading } = useFetch(getFacilities, [])

  return (
    <>
      <Helmet>
        <title>Facilities — Khwopring English Secondary School</title>
        <meta name="description" content="Explore the classrooms, labs, library, and sports facilities at Khwopring English Secondary School." />
      </Helmet>
      <PageHero
        title="Facilities"
        subtitle="Everything a school day needs, under one roof."
      />
      <section className="py-20">
        <Container>
          {!loading && facilities?.length === 0 && (
            <p className="text-center text-navy/60 dark:text-cream-100/60">Facilities will be listed here soon.</p>
          )}
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {facilities?.map((facility, i) => (
              <Card key={facility.id} delay={i * 0.08}>
                <img
                  src={getFeaturedImageUrl(facility, 'card')}
                  alt={decodeHtml(facility.title.rendered)}
                  loading="lazy"
                  className="h-48 w-full object-cover"
                />
                <div className="p-6">
                  <h3 className="mb-2 text-lg font-semibold">{decodeHtml(facility.title.rendered)}</h3>
                  <div
                    className="text-sm text-navy/70 dark:text-cream-100/70"
                    dangerouslySetInnerHTML={{ __html: facility.content?.rendered ?? '' }}
                  />
                </div>
              </Card>
            ))}
          </div>
        </Container>
      </section>
    </>
  )
}
