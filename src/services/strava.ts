import axios from 'axios'
import Cache from './cache'
import { ApolloError } from 'apollo-server-core'
import * as crypto from '../auth/crypto'
import { JwtPayload } from '../auth/jwt'

export type AccessToken = string
export type RefreshToken = string
export type EncryptedRefreshToken = string

interface StravaAuthResponse {
  access_token: AccessToken // Short-lived API authentication token
  refresh_token: RefreshToken // Long-lived token to request access tokens
  expires_at: number // Expiration date of the access_token (unix timestamp)
  athlete?: {
    id: number
  }
}

export interface StravaAuth {
  userId: number
  accessToken: AccessToken
  refreshToken: EncryptedRefreshToken
  expiresIn: number
  cacheKey: string // Hash of encrypted refresh token
}

const encryptRefreshToken = (
  token: RefreshToken
): Promise<EncryptedRefreshToken> => {
  return crypto.encrypt(token)
}

const decryptRefreshToken = (
  token: EncryptedRefreshToken
): Promise<RefreshToken> => {
  return crypto.decrypt(token)
}

const makeAuth = async (response: StravaAuthResponse): Promise<StravaAuth> => {
  const now = Math.round(Date.now() / 1000)
  const refreshToken = await encryptRefreshToken(response.refresh_token)
  return {
    refreshToken,
    accessToken: response.access_token,
    expiresIn: response.expires_at - now,
    cacheKey: crypto.hashString(refreshToken),
    userId: response.athlete ? response.athlete.id : -1
  }
}

export const parseAuthFromJwt = (jwt: JwtPayload): StravaAuth => {
  const now = Math.round(Date.now() / 1000)
  return {
    userId: jwt.sub,
    refreshToken: jwt.rtk,
    accessToken: jwt.atk,
    expiresIn: jwt.exp - now,
    cacheKey: crypto.hashString(jwt.rtk)
  }
}

// --

export class StravaAPIError extends ApolloError {
  constructor(message: string, properties?: Record<string, any>) {
    super(message, 'STRAVA_API_ERROR', properties)

    Object.defineProperty(this, 'name', { value: 'StravaAPIError' })
  }
}

// --

const cacheConfig = {
  ttl: '7 days',
  refreshRate: '15 min'
}

const caches = {
  athletes: new Cache<Athlete>(cacheConfig),
  activities: new Cache<Activity>(cacheConfig)
}

// --

const api = axios.create({
  baseURL: 'https://www.strava.com/api/v3'
})

const injectAuthorizationHeader = (accessToken: AccessToken) => ({
  headers: {
    authorization: `Bearer ${accessToken}`
  }
})

// Wrapped Endpoints --

export const exchangeToken = async (code: string): Promise<StravaAuth> => {
  return axios
    .post('https://www.strava.com/oauth/token', {
      client_id: process.env.STRAVA_CLIENT_ID,
      client_secret: process.env.STRAVA_CLIENT_SECRET,
      code,
      grant_type: 'authorization_code'
    })
    .then(res => res.data)
    .then(makeAuth)
    .catch(error => {
      throw new StravaAPIError('Login with Strava failed', {
        action: 'exchange-token',
        path: '/oauth/token',
        details: error.message
      })
    })
}

export const refreshToken = async (
  refreshToken: RefreshToken
): Promise<StravaAuthResponse> => {
  const refresh_token = await decryptRefreshToken(refreshToken)
  return axios
    .post('https://www.strava.com/oauth/token', {
      client_id: process.env.STRAVA_CLIENT_ID,
      client_secret: process.env.STRAVA_CLIENT_SECRET,
      refresh_token,
      grant_type: 'refresh_token'
    })
    .then(res => res.data)
    .catch(error => {
      throw new StravaAPIError('Login with Strava failed', {
        action: 'refresh-token',
        path: '/oauth/token',
        details: error.message
      })
    })
}

export const deauthorize = async (accessToken: AccessToken) => {
  return axios
    .post('https://www.strava.com/oauth/deauthorize', {
      access_token: accessToken
    })
    .then(res => res.data)
    .catch(error => {
      throw new StravaAPIError('Logout from Strava failed', {
        action: 'deauthorize',
        path: '/oauth/deauthorize',
        details: error.message
      })
    })
}

// --

interface Athlete {
  id: number
  name: string
}

export const getCurrentAthlete = async (auth: StravaAuth): Promise<Athlete> => {
  const key = `${auth.cacheKey}:/athlete`
  const cached = caches.athletes.get(key)
  if (cached) {
    return cached
  }
  const data = await api
    .get('/athlete', injectAuthorizationHeader(auth.accessToken))
    .then(res => res.data)
    .catch(error => {
      throw new StravaAPIError('Failed to retrieve athlete data', {
        action: 'get-current-athlete',
        path: '/athlete',
        details: error.message
      })
    })
  caches.athletes.set(key, data)
  return data
}

// --

export interface Activity {
  id: number
}

export const getActivity = async (auth: StravaAuth, id: number) => {
  const key = `${auth.cacheKey}:/activities/${id}`
  const cached = caches.activities.get(key)
  if (cached) {
    return cached
  }
  const data: Activity = await api
    .get(`/activities/${id}`, injectAuthorizationHeader(auth.accessToken))
    .then(res => <Activity>res.data)
    .catch(error => {
      throw new StravaAPIError('Failed to retrieve activity', {
        action: 'get-activity',
        id,
        path: `/activities/${id}`,
        details: error.message
      })
    })
  caches.activities.set(key, data)
  return data
}

// --

export const getActivities = async (auth: StravaAuth, _options = {}) => {
  const options = {
    pageSize: 30,
    before: null,
    after: null,
    ..._options
  }
  return api
    .get('/athlete/activities', {
      ...injectAuthorizationHeader(auth.accessToken),
      params: {
        before: options.before,
        after: options.after,
        page_size: options.pageSize
      }
    })
    .then(res => res.data)
    .then((activities: Activity[]) => {
      activities.forEach(activity => {
        // Pre-fill cache for faster detail queries
        caches.activities.set(
          `${auth.cacheKey}:/activities/${activity.id}`,
          activity
        )
      })
      return activities
    })
    .catch(error => {
      throw new StravaAPIError('Failed to retrieve activities', {
        action: 'get-activities',
        path: `/athlete/activities`,
        details: error.message
      })
    })
}
