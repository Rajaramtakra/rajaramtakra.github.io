import { Helmet } from 'react-helmet-async'
import { useSiteSettings } from '../context/SiteSettingsContext'
import PageHero from '../components/PageHero'
import Container from '../components/Container'
import ContactForm from '../components/ContactForm'

export default function Contact() {
  const { settings } = useSiteSettings()

  return (
    <>
      <Helmet>
        <title>Contact — Khwopring English Secondary School</title>
        <meta name="description" content="Get in touch with Khwopring English Secondary School — address, phone, email, and a contact form." />
      </Helmet>
      <PageHero title="Contact Us" subtitle="We'd love to hear from you." />

      <section className="py-20">
        <Container className="grid grid-cols-1 gap-12 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <h2 className="mb-6 text-2xl">Get in Touch</h2>
            <ul className="space-y-4 text-navy/80 dark:text-cream-100/80">
              {settings?.address && (
                <li>
                  <p className="text-xs font-semibold uppercase tracking-wide text-rust">Address</p>
                  <p>{settings.address}</p>
                </li>
              )}
              {settings?.phone && (
                <li>
                  <p className="text-xs font-semibold uppercase tracking-wide text-rust">Phone</p>
                  <p>
                    {settings.phone}
                    {settings.phone_alt ? ` / ${settings.phone_alt}` : ''}
                  </p>
                </li>
              )}
              {settings?.email && (
                <li>
                  <p className="text-xs font-semibold uppercase tracking-wide text-rust">Email</p>
                  <p>{settings.email}</p>
                </li>
              )}
              {settings?.office_hours && (
                <li>
                  <p className="text-xs font-semibold uppercase tracking-wide text-rust">Office Hours</p>
                  <p>{settings.office_hours}</p>
                </li>
              )}
            </ul>

            {settings?.google_map_embed && (
              <div className="mt-8 overflow-hidden rounded-xl shadow-card">
                <iframe
                  title="School location"
                  src={settings.google_map_embed}
                  width="100%"
                  height="260"
                  loading="lazy"
                  style={{ border: 0 }}
                />
              </div>
            )}
          </div>

          <div className="lg:col-span-3">
            <h2 className="mb-6 text-2xl">Send a Message</h2>
            <ContactForm />
          </div>
        </Container>
      </section>
    </>
  )
}
