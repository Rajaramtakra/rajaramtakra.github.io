import apiClient from './apiClient'

export async function getTeachers() {
  const { data } = await apiClient.get('/wp/v2/teacher', {
    params: { orderby: 'menu_order', order: 'asc', per_page: 50, _embed: true },
  })
  return data
}
