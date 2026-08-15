import apiClient from './apiClient'

export async function getEvents({ page = 1, perPage = 10, category } = {}) {
  const { data, headers } = await apiClient.get('/wp/v2/event', {
    params: { page, per_page: perPage, _embed: true, event_category: category },
  })
  return { items: data, total: Number(headers['x-wp-total'] ?? data.length) }
}

export async function getEventBySlug(slug) {
  const { data } = await apiClient.get('/wp/v2/event', { params: { slug, _embed: true } })
  return data[0] ?? null
}
