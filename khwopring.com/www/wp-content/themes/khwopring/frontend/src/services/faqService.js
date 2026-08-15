import apiClient from './apiClient'

export async function getFaqs() {
  const { data } = await apiClient.get('/wp/v2/faq_item', {
    params: { orderby: 'menu_order', order: 'asc', per_page: 50 },
  })
  return data
}
