import apiClient from './apiClient'

export async function sendContactMessage(payload) {
  const { data } = await apiClient.post('/khwopring/v1/contact', payload)
  return data
}
