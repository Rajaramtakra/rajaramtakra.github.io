import { Swiper, SwiperSlide } from 'swiper/react'
import { Autoplay, Pagination } from 'swiper/modules'
import useFetch from '../hooks/useFetch'
import { getTestimonials } from '../services/testimonialService'
import { getHomePageContent } from '../services/homeService'
import { getFeaturedImageUrl, decodeHtml } from '../utils/wpHelpers'
import Container from '../components/Container'
import Card from '../components/Card'
import Accordion from '../components/Accordion'
import SectionHeading from '../components/SectionHeading'

import 'swiper/css'
import 'swiper/css/pagination'

export default function Testimonials() {
  const { data: testimonials, loading: loadingTestimonials } = useFetch(getTestimonials, [])
  const { data: page, loading: loadingPage } = useFetch(getHomePageContent, [])

  if (loadingTestimonials || loadingPage) return null
  if (!testimonials?.length) return null

  const acf = page?.acf ?? {}
  const infoItems = [
    { id: 'vision', question: 'Vision', answer: acf.vision_text },
    { id: 'mission', question: 'Mission & Goal', answer: acf.mission_text },
    { id: 'objectives', question: 'Objectives', answer: acf.objectives_text },
    { id: 'history', question: 'Our History', answer: acf.history_text },
  ].filter((item) => item.answer)

  return (
    <section className="bg-cream-200 py-20 dark:bg-white/5">
      <Container className="grid grid-cols-1 gap-10 lg:grid-cols-5 lg:items-start">
        <div className="lg:col-span-3">
          <SectionHeading eyebrow="Testimonials" title="What Our Student Says?" />
          <Swiper
            modules={[Autoplay, Pagination]}
            autoplay={{ delay: 8000, disableOnInteraction: false }}
            pagination={{ clickable: true }}
            loop={testimonials.length > 1}
            className="testimonials-slider pb-10"
          >
            {testimonials.map((t) => (
              <SwiperSlide key={t.id}>
                <Card className="p-8 md:p-10">
                  <div className="flex flex-col items-center text-center">
                    {getFeaturedImageUrl(t, 'thumbnail') && (
                      <img
                        src={getFeaturedImageUrl(t, 'thumbnail')}
                        alt={decodeHtml(t.title.rendered)}
                        className="mb-6 h-24 w-24 rounded-full object-cover shadow-card"
                      />
                    )}
                    <div
                      className="prose prose-neutral mb-6 max-w-none text-navy/80 dark:prose-invert dark:text-cream-100/80"
                      dangerouslySetInnerHTML={{ __html: t.content?.rendered ?? '' }}
                    />
                    <p className="font-display font-semibold text-navy dark:text-cream-100">
                      {decodeHtml(t.title.rendered)}
                    </p>
                    {t.acf?.role && <p className="text-sm text-rust">{t.acf.role}</p>}
                  </div>
                </Card>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>

        {infoItems.length > 0 && (
          <div className="lg:col-span-2">
            <Accordion items={infoItems} />
          </div>
        )}
      </Container>
    </section>
  )
}
