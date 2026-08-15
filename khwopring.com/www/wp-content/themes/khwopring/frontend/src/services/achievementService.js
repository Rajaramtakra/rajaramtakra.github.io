import apiClient from './apiClient'

export async function getAchievements() {
  const { data } = await apiClient.get('/wp/v2/achievement', {
    params: { per_page: 20, _embed: true },
  })
  return data
}
