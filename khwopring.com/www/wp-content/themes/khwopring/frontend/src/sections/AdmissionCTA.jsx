import useFetch from '../hooks/useFetch'
import { getHomePageContent } from '../services/homeService'
import { getAcfImageUrl, decodeHtml } from '../utils/wpHelpers'
import Container from '../components/Container'
import Button from '../components/Button'

export default function AdmissionCTA() {
  const { data: page, loading } = useFetch(getHomePageContent, [])
  if (loading || !page) return null
  const acf = page.acf ?? {}
  if (!acf.admission_cta_title) return null

  return (
    <section className="pb-20">
      <Container>
        <div className="grid grid-cols-1 overflow-hidden rounded-2xl md:grid-cols-2">
          {acf.admission_cta_image && (
            <img
              src={getAcfImageUrl(acf.admission_cta_image, 'card')}
              alt={decodeHtml(acf.admission_cta_title)}
              loading="lazy"
              className="h-64 w-full object-cover md:h-auto"
            />
          )}
          <div className="flex flex-col justify-center bg-navy-900 p-10 text-white">
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-gold">
              Intake 2026 Applications Are Now Open
            </p>
            <h2 className="mb-4 text-2xl text-white md:text-3xl">{acf.admission_cta_title}</h2>
            <p className="mb-6 text-cream-200/80">{acf.admission_cta_description}</p>
            <div className="flex flex-wrap gap-3">
              <Button to={acf.admission_cta_button_link || '/admission'} variant="primary">
                {acf.admission_cta_button_label || 'Apply Now'}
              </Button>
              <Button to="/contact" variant="outline">
                Call Admissions
              </Button>
            </div>
          </div>
        </div>
      </Container>
    </section>
  )
}
