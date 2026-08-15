import apiClient from './apiClient'

export async function getAdmissionNotices() {
  const { data } = await apiClient.get('/wp/v2/admission_notice', {
    params: { per_page: 5, _embed: true },
  })
  return data
}
