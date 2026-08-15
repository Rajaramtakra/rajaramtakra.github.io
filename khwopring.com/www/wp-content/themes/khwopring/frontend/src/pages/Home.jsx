import { Helmet } from 'react-helmet-async'
import HeroSlider from '../sections/HeroSlider'
import WhyUs from '../sections/WhyUs'
import About from '../sections/About'
import Testimonials from '../sections/Testimonials'
import Facilities from '../sections/Facilities'
import Stats from '../sections/Stats'
import NewsEvents from '../sections/NewsEvents'
import AdmissionCTA from '../sections/AdmissionCTA'
import GalleryPreview from '../sections/GalleryPreview'

export default function Home() {
  return (
    <>
      <Helmet>
        <title>Khwopring English Secondary School</title>
        <meta
          name="description"
          content="Khwopring English Secondary School in Libali, Bhaktapur — Nursery to Grade 10, building on quality of school life since 2000."
        />
      </Helmet>
      <HeroSlider />
      <WhyUs />
      <About />
      <Testimonials />
      <Facilities />
      <Stats />
      <NewsEvents />
      <AdmissionCTA />
      <GalleryPreview />
    </>
  )
}
