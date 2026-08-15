import apiClient from './apiClient'

export async function getSiteSettings() {
  const { data } = await apiClient.get('/khwopring/v1/site-settings')
  return data
}

export async function getMenu(location = 'primary') {
  const { data } = await apiClient.get('/khwopring/v1/menu', { params: { location } })
  return data
}
