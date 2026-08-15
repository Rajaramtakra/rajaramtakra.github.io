import apiClient from './apiClient'

export async function getNews({ page = 1, perPage = 10, category } = {}) {
  const { data, headers } = await apiClient.get('/wp/v2/news', {
    params: { page, per_page: perPage, _embed: true, news_category: category },
  })
  return { items: data, total: Number(headers['x-wp-total'] ?? data.length) }
}

export async function getNewsBySlug(slug) {
  const { data } = await apiClient.get('/wp/v2/news', { params: { slug, _embed: true } })
  return data[0] ?? null
}
