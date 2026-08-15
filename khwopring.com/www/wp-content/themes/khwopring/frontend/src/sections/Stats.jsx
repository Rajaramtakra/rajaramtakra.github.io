import useFetch from '../hooks/useFetch'
import { getStatistics, getHomePageContent } from '../services/homeService'
import { getAcfImageUrl } from '../utils/wpHelpers'
import Container from '../components/Container'
import StatCounter from '../components/StatCounter'
import StatIcon from '../components/StatIcon'

export default function Stats() {
  const { data: stats, loading: loadingStats } = useFetch(getStatistics, [])
  const { data: page } = useFetch(getHomePageContent, [])

  if (loadingStats || !stats?.length) return null

  const bgImage = getAcfImageUrl(page?.acf?.stats_bg_image, 'hero')

  return (
    <section
      className="relative bg-navy-900 bg-cover bg-center py-14 text-white"
      style={bgImage ? { backgroundImage: `url(${bgImage})` } : undefined}
    >
      {bgImage && <div className="absolute inset-0 bg-navy-900/90" />}
      <Container className="relative grid grid-cols-2 gap-8 md:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.id} className="text-center">
            <StatIcon icon={stat.acf?.icon} className="mx-auto mb-3 h-8 w-8 text-gold" />
            <p className="font-display text-3xl font-bold text-gold md:text-4xl">
              <StatCounter value={Number(stat.acf?.number ?? 0)} suffix={stat.acf?.suffix ?? ''} />
            </p>
            <p className="mt-1 text-xs uppercase tracking-widest text-cream-200/70">{stat.acf?.label}</p>
          </div>
        ))}
      </Container>
    </section>
  )
}
