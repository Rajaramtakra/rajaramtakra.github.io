import apiClient from './apiClient'

export async function search(query) {
  if (!query?.trim()) return []
  const { data } = await apiClient.get('/khwopring/v1/search', { params: { q: query } })
  return data
}
