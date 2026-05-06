import axios from 'axios'

export const api = axios.create({
  baseURL: 'https://task-manager-production-ce2a.up.railway.app/api',
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
