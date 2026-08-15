import { useMemo, useState } from 'react'
import { Helmet } from 'react-helmet-async'
import useFetch from '../hooks/useFetch'
import { getGalleryItems } from '../services/galleryService'
import { getFeaturedImageUrl, decodeHtml } from '../utils/wpHelpers'
import PageHero from '../components/PageHero'
import Container from '../components/Container'
import Lightbox from '../components/Lightbox'

export default function Gallery() {
  const { data, loading } = useFetch(() => getGalleryItems({ perPage: 100 }), [])
  const items = useMemo(() => data?.items ?? [], [data])
  const [category, setCategory] = useState('all')
  const [lightboxIndex, setLightboxIndex] = useState(null)

  const categories = useMemo(() => {
    const map = new Map()
    items.forEach((item) => {
      item._embedded?.['wp:term']?.flat().forEach((term) => {
        if (term.taxonomy === 'gallery_category') map.set(term.slug, term.name)
      })
    })
    return Array.from(map, ([slug, name]) => ({ slug, name }))
  }, [items])

  const filteredItems =
    category === 'all'
      ? items
      : items.filter((item) =>
          item._embedded?.['wp:term']?.flat().some((term) => term.taxonomy === 'gallery_category' && term.slug === category),
        )

  const lightboxImages = useMemo(
    () =>
      filteredItems.map((item) => ({
        src: getFeaturedImageUrl(item, 'full') ?? getFeaturedImageUrl(item, 'card'),
        alt: decodeHtml(item.title.rendered),
      })),
    [filteredItems],
  )

  return (
    <>
      <Helmet>
        <title>Gallery — Khwopring English Secondary School</title>
        <meta name="description" content="Photos from campus life, events, and everyday moments at Khwopring English Secondary School." />
      </Helmet>
      <PageHero title="Gallery" subtitle="A look inside everyday life at Khwopring." />

      <section className="py-20">
        <Container>
          {categories.length > 0 && (
            <div className="mb-8 flex flex-wrap gap-2">
              <button
                onClick={() => setCategory('all')}
                className={`rounded-full px-4 py-2 text-sm font-medium ${
                  category === 'all' ? 'bg-rust text-white' : 'bg-cream-200 text-navy dark:bg-white/10 dark:text-cream-100'
                }`}
              >
                All
              </button>
              {categories.map((c) => (
                <button
                  key={c.slug}
                  onClick={() => setCategory(c.slug)}
                  className={`rounded-full px-4 py-2 text-sm font-medium ${
                    category === c.slug ? 'bg-rust text-white' : 'bg-cream-200 text-navy dark:bg-white/10 dark:text-cream-100'
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          )}

          {!loading && filteredItems.length === 0 && (
            <p className="text-center text-navy/60 dark:text-cream-100/60">No gallery images in this category yet.</p>
          )}

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {filteredItems.map((item, idx) => {
              const src = getFeaturedImageUrl(item, 'card')
              return (
                <button
                  key={item.id}
                  className="group aspect-square overflow-hidden rounded-lg"
                  onClick={() => setLightboxIndex(idx)}
                >
                  <img
                    src={src}
                    alt={decodeHtml(item.title.rendered)}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                </button>
              )
            })}
          </div>
        </Container>
      </section>

      <Lightbox
        images={lightboxImages}
        index={lightboxIndex}
        onClose={() => setLightboxIndex(null)}
        onNext={() => setLightboxIndex((i) => (i + 1) % lightboxImages.length)}
        onPrev={() => setLightboxIndex((i) => (i - 1 + lightboxImages.length) % lightboxImages.length)}
      />
    </>
  )
}
