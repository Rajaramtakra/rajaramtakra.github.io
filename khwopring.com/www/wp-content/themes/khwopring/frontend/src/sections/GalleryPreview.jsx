import { useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import useFetch from '../hooks/useFetch'
import { getGalleryItems } from '../services/galleryService'
import { getFeaturedImageUrl, decodeHtml } from '../utils/wpHelpers'
import Container from '../components/Container'
import SectionHeading from '../components/SectionHeading'
import Lightbox from '../components/Lightbox'

export default function GalleryPreview() {
  const { data } = useFetch(() => getGalleryItems({ perPage: 12 }), [])
  const items = useMemo(() => data?.items ?? [], [data])
  const trackRef = useRef(null)
  const [lightboxIndex, setLightboxIndex] = useState(null)

  const lightboxImages = useMemo(
    () =>
      items.map((item) => {
        const thumb = getFeaturedImageUrl(item, 'card')
        return {
          src: getFeaturedImageUrl(item, 'full') ?? thumb,
          alt: decodeHtml(item.title.rendered),
        }
      }),
    [items],
  )

  if (!items.length) return null

  function scrollByAmount(direction) {
    const track = trackRef.current
    if (!track) return
    track.scrollBy({ left: direction * track.clientWidth * 0.8, behavior: 'smooth' })
  }

  return (
    <section className="bg-navy-900/90 py-20">
      <Container>
        <SectionHeading
          eyebrow="A Look Inside"
          title={<span className="text-white">Gallery</span>}
          action={
            <Link to="/gallery" className="font-semibold text-gold hover:underline">
              View full gallery →
            </Link>
          }
        />

        <div className="relative">
          <div
            ref={trackRef}
            className="flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {items.map((item, idx) => {
              const thumb = getFeaturedImageUrl(item, 'card')
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setLightboxIndex(idx)}
                  className="group aspect-square w-40 flex-none snap-start overflow-hidden rounded-lg sm:w-48 md:w-56"
                >
                  <img
                    src={thumb}
                    alt={decodeHtml(item.title.rendered)}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                </button>
              )
            })}
          </div>

          {items.length > 3 && (
            <>
              <button
                type="button"
                aria-label="Scroll gallery left"
                onClick={() => scrollByAmount(-1)}
                className="absolute -left-4 top-1/2 hidden -translate-y-1/2 rounded-full bg-white/15 p-2 text-white backdrop-blur transition hover:bg-white/30 md:block"
              >
                <ChevronIcon direction="left" />
              </button>
              <button
                type="button"
                aria-label="Scroll gallery right"
                onClick={() => scrollByAmount(1)}
                className="absolute -right-4 top-1/2 hidden -translate-y-1/2 rounded-full bg-white/15 p-2 text-white backdrop-blur transition hover:bg-white/30 md:block"
              >
                <ChevronIcon direction="right" />
              </button>
            </>
          )}
        </div>
      </Container>

      <Lightbox
        images={lightboxImages}
        index={lightboxIndex}
        onClose={() => setLightboxIndex(null)}
        onNext={() => setLightboxIndex((i) => (i + 1) % lightboxImages.length)}
        onPrev={() => setLightboxIndex((i) => (i - 1 + lightboxImages.length) % lightboxImages.length)}
      />
    </section>
  )
}

function ChevronIcon({ direction }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path
        d={direction === 'left' ? 'M15 6l-6 6 6 6' : 'M9 6l6 6-6 6'}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
