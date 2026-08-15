import { Link } from 'react-router-dom'
import { useSiteSettings } from '../context/SiteSettingsContext'
import Container from '../components/Container'

const quickLinks = [
  { label: 'Home', to: '/' },
  { label: 'About Us', to: '/about' },
  { label: 'Academics', to: '/academics' },
  { label: 'Teachers', to: '/teachers' },
  { label: 'News', to: '/news' },
  { label: 'Events', to: '/events' },
  { label: 'Facilities', to: '/facilities' },
  { label: 'Admission', to: '/admission' },
  { label: 'FAQ', to: '/faq' },
]

const usefulLinks = [
  { label: 'Ministry of Education', href: 'https://moe.gov.np' },
  { label: 'Nepal Education Board', href: 'https://neb.gov.np' },
  { label: 'Tribhuvan University', href: 'https://tu.edu.np' },
  { label: 'University Grants Commission', href: 'https://ugcnepal.edu.np' },
]

const socialKeys = [
  { key: 'facebook_url', label: 'Facebook' },
  { key: 'instagram_url', label: 'Instagram' },
  { key: 'youtube_url', label: 'YouTube' },
  { key: 'linkedin_url', label: 'LinkedIn' },
  { key: 'twitter_url', label: 'Twitter / X' },
]

export default function Footer() {
  const { settings } = useSiteSettings()
  const year = new Date().getFullYear()

  return (
    <footer className="bg-navy-900 text-cream-200">
      <Container className="grid grid-cols-1 gap-10 py-14 md:grid-cols-4">
        <div>
          <h3 className="mb-1 font-display text-xl font-bold text-white">Khwopring</h3>
          <p className="mb-4 text-xs uppercase tracking-wider text-rust">English Secondary School</p>
          <p className="text-sm text-cream-200/80">
            Founded in 2000 A.D. by socially aware youths of Bhaktapur — building on quality of school life ever
            since.
          </p>
          <div className="mt-4 flex gap-3">
            {socialKeys
              .filter((s) => settings?.[s.key])
              .map((s) => (
                <a
                  key={s.key}
                  href={settings[s.key]}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={s.label}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 hover:bg-rust"
                >
                  {s.label[0]}
                </a>
              ))}
          </div>
        </div>

        <div>
          <h4 className="mb-4 font-semibold text-white">Quick Menu</h4>
          <ul className="space-y-2 text-sm columns-2 gap-6">
            {quickLinks.map((link) => (
              <li key={link.to}>
                <Link to={link.to} className="text-cream-200/80 hover:text-gold">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="mb-4 font-semibold text-white">Useful Links</h4>
          <ul className="space-y-2 text-sm">
            {usefulLinks.map((link) => (
              <li key={link.href}>
                <a href={link.href} target="_blank" rel="noreferrer" className="text-cream-200/80 hover:text-gold">
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="mb-4 font-semibold text-white">Contact</h4>
          <ul className="space-y-2 text-sm text-cream-200/80">
            {settings?.address && <li>{settings.address}</li>}
            {settings?.phone && <li>{settings.phone}{settings?.phone_alt ? ` / ${settings.phone_alt}` : ''}</li>}
            {settings?.email && <li>{settings.email}</li>}
          </ul>
        </div>
      </Container>

      <div className="border-t border-white/10 py-4">
        <Container className="flex flex-col items-center justify-between gap-2 text-xs text-cream-200/60 md:flex-row [&_a]:text-white">
          <p>© {year} Khwopring English Academy (Secondary). All rights reserved.</p>
          <p>Powered by <a href="https://rajaramtakra.github.io/" target="_blank">Rajwebdesign</a></p>
        </Container>
      </div>
    </footer>
  )
}
