import api from '@/api/index.js'

export function getSearch(keywords, limit = 20) {
  return api.get('/search', { params: { keywords, limit } })
}
