import { Helmet } from 'react-helmet-async'
import useFetch from '../hooks/useFetch'
import { getTeachers } from '../services/teacherService'
import { getFeaturedImageUrl, decodeHtml } from '../utils/wpHelpers'
import PageHero from '../components/PageHero'
import Container from '../components/Container'
import Card from '../components/Card'

export default function Teachers() {
  const { data: teachers, loading } = useFetch(getTeachers, [])

  return (
    <>
      <Helmet>
        <title>Teachers — Khwopring English Secondary School</title>
        <meta name="description" content="Meet the teachers and staff at Khwopring English Secondary School." />
      </Helmet>
      <PageHero title="Our Teachers" subtitle="The people who make Khwopring what it is." />
      <section className="py-20">
        <Container>
          {!loading && teachers?.length === 0 && (
            <p className="text-center text-navy/60 dark:text-cream-100/60">Teacher profiles will be listed here soon.</p>
          )}
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {teachers?.map((teacher, i) => (
              <Card key={teacher.id} delay={i * 0.08} className="text-center">
                <img
                  src={getFeaturedImageUrl(teacher, 'card')}
                  alt={decodeHtml(teacher.title.rendered)}
                  loading="lazy"
                  className="h-56 w-full object-cover"
                />
                <div className="p-5">
                  <h3 className="font-semibold">{decodeHtml(teacher.title.rendered)}</h3>
                  <p className="text-sm text-rust">{teacher.acf?.designation}</p>
                  {teacher.acf?.subject && (
                    <p className="mt-1 text-xs text-navy/60 dark:text-cream-100/60">{teacher.acf.subject}</p>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </Container>
      </section>
    </>
  )
}
