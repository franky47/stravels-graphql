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

const exchangeToken = (code) =>
  axios.post('https://www.strava.com/oauth/token', {
    client_id: process.env.STRAVA_CLIENT_ID,
    client_secret: process.env.STRAVA_CLIENT_SECRET,
    code
  }).then(res => res.data)

const getCurrentAthlete = (token) =>
  api.get('/athlete', injectHeader(token))
    .then(res => res.data)

const getActivity = (token, id) =>
  api.get(`/activities/${id}`, injectHeader(token))
    .then(res => res.data)

const getActivities = (token, page = 1, pageSize = 30) =>
  api.get('/athlete/activities', {
    ...injectHeader(token),
    params: {
      page,
      page_size: pageSize
    }
  }).then(res => res.data)

const getAllActivities = async (token) => {
  let activities = []
  let page = 1
  while (true) {
    let data = []
    try {
      data = await getActivities(token, page, 100)
    } catch (error) {
      // todo: if rate-limiting, wait and try again
      // (although it might have to wait a long time)
      console.log(`Error while fetching all activities on page ${page}`, error)
      break // Probably rate-limited, return what you can
    }
    if (data.length === 0) {
      break
    }
    activities = [...activities, ...data]
    page++
  }
  return activities
}

export default {
  exchangeToken,
  getCurrentAthlete,
  getActivity,
  getAllActivities
}
