import apiClient from './apiClient'

export async function getTestimonials() {
  const { data } = await apiClient.get('/wp/v2/testimonial', {
    params: { per_page: 20, _embed: true },
  })
  return data
}
