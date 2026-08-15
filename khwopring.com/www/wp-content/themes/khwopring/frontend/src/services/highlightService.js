import apiClient from './apiClient'

export async function getHighlights() {
  const { data } = await apiClient.get('/wp/v2/highlight', {
    params: { orderby: 'menu_order', order: 'asc', per_page: 20, _embed: true },
  })
  return data
}
