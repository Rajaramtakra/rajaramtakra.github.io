import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'
import { SiteSettingsProvider } from './context/SiteSettingsContext'
import { ThemeProvider } from './context/ThemeContext'
import MainLayout from './layout/MainLayout'
import PageLoader from './components/PageLoader'

const Home = lazy(() => import('./pages/Home'))
const About = lazy(() => import('./pages/About'))
const Academics = lazy(() => import('./pages/Academics'))
const Facilities = lazy(() => import('./pages/Facilities'))
const Teachers = lazy(() => import('./pages/Teachers'))
const Gallery = lazy(() => import('./pages/Gallery'))
const News = lazy(() => import('./pages/News'))
const NewsDetail = lazy(() => import('./pages/NewsDetail'))
const Events = lazy(() => import('./pages/Events'))
const EventDetail = lazy(() => import('./pages/EventDetail'))
const Contact = lazy(() => import('./pages/Contact'))
const Admission = lazy(() => import('./pages/Admission'))
const Faq = lazy(() => import('./pages/Faq'))
const ComingSoon = lazy(() => import('./pages/ComingSoon'))

export default function App() {
  return (
    <ThemeProvider>
      <SiteSettingsProvider>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route element={<MainLayout />}>
              <Route index element={<Home />} />
              <Route path="about" element={<About />} />
              <Route path="academics" element={<Academics />} />
              <Route path="facilities" element={<Facilities />} />
              <Route path="teachers" element={<Teachers />} />
              <Route path="news" element={<News />} />
              <Route path="news/:slug" element={<NewsDetail />} />
              <Route path="events" element={<Events />} />
              <Route path="event/:slug" element={<EventDetail />} />
              <Route path="gallery" element={<Gallery />} />
              <Route path="admission" element={<Admission />} />
              <Route path="contact" element={<Contact />} />
              <Route path="faq" element={<Faq />} />
              <Route path="*" element={<ComingSoon title="Page Not Found" />} />
            </Route>
          </Routes>
        </Suspense>
      </SiteSettingsProvider>
    </ThemeProvider>
  )
}
