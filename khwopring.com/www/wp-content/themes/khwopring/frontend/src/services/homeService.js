import apiClient from './apiClient'

export async function getHeroSlides() {
  const { data } = await apiClient.get('/wp/v2/hero_slide', {
    params: { orderby: 'menu_order', order: 'asc', per_page: 10, _embed: true },
  })
  return data
}

export async function getStatistics() {
  const { data } = await apiClient.get('/wp/v2/statistic', {
    params: { orderby: 'menu_order', order: 'asc', per_page: 10 },
  })
  return data
}

export async function getPrincipalMessage() {
  const { data } = await apiClient.get('/wp/v2/principal_message', {
    params: { orderby: 'menu_order', order: 'asc', per_page: 1, _embed: true },
  })
  return data[0] ?? null
}

export async function getHomePageContent() {
  const { data } = await apiClient.get('/wp/v2/pages', {
    params: { slug: 'home' },
  })
  return data[0] ?? null
}
