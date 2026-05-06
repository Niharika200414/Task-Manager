import axios from 'axios'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000/api',
  withCredentials: true,
})

api.interceptors.response.use(
  (r) => r,
  (err) => {
    const apiErr = err?.response?.data?.error
    if (apiErr) {
      err.message = apiErr.message || err.message
      err.code = apiErr.code
      err.details = apiErr.details
    }
    throw err
  },
)
