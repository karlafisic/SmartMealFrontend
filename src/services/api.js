import axios from 'axios'

const api = axios.create({
  baseURL: 'http://smartmeal.test/api',
})

// Interceptor: ako postoji token u localStorage, dodaj ga u svaki zahtjev
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export default api
