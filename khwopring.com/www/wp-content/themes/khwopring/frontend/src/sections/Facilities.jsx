import useFetch from '../hooks/useFetch'
import { getFacilities } from '../services/facilityService'
import { getFeaturedImageUrl, decodeHtml } from '../utils/wpHelpers'
import Container from '../components/Container'
import Card from '../components/Card'
import SectionHeading from '../components/SectionHeading'
import Button from '../components/Button'

export default function Facilities() {
  const { data: facilities, loading } = useFetch(getFacilities, [])

  if (loading || !facilities?.length) return null

  return (
    <section className="bg-cream-200 pb-20 dark:bg-white/5">
      <Container>
        <SectionHeading
          eyebrow="Life at Khwopring"
          title="Everything a school day needs, under one roof."
          action={
            <Button
              to="/facilities"
              variant="outline"
              className="!text-navy !border-navy/30 hover:!bg-navy/5 dark:!text-cream-100 dark:!border-cream-100/30 dark:hover:!bg-white/10"
            >
              See all facilities →
            </Button>
          }
        />
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {facilities.map((facility, i) => {
            const image = getFeaturedImageUrl(facility, 'card')
            return (
              <Card key={facility.id} delay={i * 0.08} className="group relative aspect-[4/5]">
                <img
                  src={image}
                  alt={decodeHtml(facility.title.rendered)}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 flex items-end bg-gradient-to-t from-navy-900/80 via-navy-900/10 to-transparent p-5">
                  <h3 className="text-lg font-semibold text-white">{decodeHtml(facility.title.rendered)}</h3>
                </div>
              </Card>
            )
          })}
        </div>
      </Container>
    </section>
  )
}
