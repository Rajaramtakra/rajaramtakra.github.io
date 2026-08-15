import apiClient from './apiClient'

export async function getNotices({ page = 1, perPage = 20 } = {}) {
  const { data, headers } = await apiClient.get('/wp/v2/notice', {
    params: { page, per_page: perPage },
  })
  return { items: data, total: Number(headers['x-wp-total'] ?? data.length) }
}
