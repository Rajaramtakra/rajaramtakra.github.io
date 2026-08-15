/** Decode WP's HTML-entity-encoded rendered strings (titles, excerpts). */
export function decodeHtml(html = '') {
  const el = document.createElement('textarea')
  el.innerHTML = html
  return el.value
}

/** Strip HTML tags from rendered WP content (e.g. excerpt) for use in a meta description. */
export function stripHtml(html = '', maxLength = 160) {
  const el = document.createElement('div')
  el.innerHTML = html
  const text = decodeHtml(el.textContent || '').replace(/\s+/g, ' ').trim()
  return text.length > maxLength ? `${text.slice(0, maxLength - 1)}…` : text
}

/** Featured image URL from a REST response fetched with _embed=true. */
export function getFeaturedImageUrl(post, size = 'full') {
  const media = post?._embedded?.['wp:featuredmedia']?.[0]
  if (!media) return null
  return media.media_details?.sizes?.[size]?.source_url ?? media.source_url ?? null
}

/** ACF image field (returned as an array with url/sizes) → plain URL. */
export function getAcfImageUrl(field, size = 'url') {
  if (!field) return null
  return field.sizes?.[size] ?? field.url ?? null
}

export function formatDate(dateString, options = { year: 'numeric', month: 'short', day: 'numeric' }) {
  if (!dateString) return ''
  return new Date(dateString).toLocaleDateString('en-US', options)
}
