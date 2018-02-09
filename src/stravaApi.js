import axios from 'axios'
import Cache from './cache'

const cache = new Cache({
  ttl: '7 days',
  refreshRate: '15 min'
})

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

const getCurrentAthlete = async (token) => {
  const key = `${token}:/athlete`
  if (cache.has(key)) {
    return cache.get(key)
  } else {
    const data = await api.get('/athlete', injectHeader(token))
      .then(res => res.data)
    cache.set(key, data)
    return data
  }
}

const getActivity = async (token, id) => {
  const key = `${token}:/activities/${id}`
  if (cache.has(key)) {
    return cache.get(key)
  } else {
    const data = await api.get(`/activities/${id}`, injectHeader(token))
      .then(res => res.data)
    cache.set(key, data)
    return data
  }
}

const getActivities = (token, _options = {}) => {
  const options = {
    pageSize: 30,
    before: null,
    after: null,
    ..._options
  }
  return api.get('/athlete/activities', {
    ...injectHeader(token),
    params: {
      before: options.before,
      after: options.after,
      page_size: options.pageSize
    }
  }).then(res => res.data)
    .then(activities => {
      activities.forEach(activity => {
        // Pre-fill cache for faster detail queries
        cache.set(`${token}:/activities/${activity.id}`, activity)
      })
      return activities
    })
}

export default {
  exchangeToken,
  getCurrentAthlete,
  getActivity,
  getActivities
}
