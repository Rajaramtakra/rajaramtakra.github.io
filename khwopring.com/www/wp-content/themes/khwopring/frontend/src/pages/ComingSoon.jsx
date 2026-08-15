import { Helmet } from 'react-helmet-async'
import Container from '../components/Container'

export default function ComingSoon({ title }) {
  return (
    <>
      <Helmet>
        <title>{title} — Khwopring English Secondary School</title>
        <meta name="robots" content="noindex" />
      </Helmet>
      <Container className="flex min-h-[50vh] flex-col items-center justify-center py-24 text-center">
        <p className="section-eyebrow mb-2">Coming Soon</p>
        <h1 className="text-3xl">{title}</h1>
        <p className="mt-3 max-w-md text-navy/60 dark:text-cream-100/60">
          This page is being built in the next phase — stay tuned.
        </p>
      </Container>
    </>
  )
}
