import apiClient from './apiClient'

export async function getPageBySlug(slug) {
  const { data } = await apiClient.get('/wp/v2/pages', { params: { slug, _embed: true } })
  return data[0] ?? null
}
