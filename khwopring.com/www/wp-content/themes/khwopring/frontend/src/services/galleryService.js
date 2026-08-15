import apiClient from './apiClient'

export async function getGalleryItems({ page = 1, perPage = 12, category } = {}) {
  const { data, headers } = await apiClient.get('/wp/v2/gallery_item', {
    params: { page, per_page: perPage, _embed: true, gallery_category: category },
  })
  return { items: data, total: Number(headers['x-wp-total'] ?? data.length) }
}
