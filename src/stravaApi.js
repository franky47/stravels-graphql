import axios from 'axios'

const api = axios.create({
  baseURL: 'https://www.strava.com/api/v3'
})

const injectHeader = (token) => ({
  headers: {
    authorization: `Bearer ${token}`
  }
})

// Wrapped Endpoints --

api.getCurrentAthlete = (token) =>
  api.get('/athlete', injectHeader(token))
    .then(res => res.data)

api.getActivities = ({ token, page = 1, pageSize = 30 }) =>
  api.get('/athlete/activities', {
    ...injectHeader(token),
    params: {
      page,
      page_size: pageSize
    }
  })
    .then(res => res.data)

export default api
