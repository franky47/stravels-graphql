import strava from '../stravaApi'
import jwt from '../jwt'
import { User } from '../db/models'
import { athleteToUser } from '../transforms'

export const loginWithCode = async (_, { code }) => {
  const data = await strava.exchangeToken(code)
  const user = athleteToUser(data.athlete)
  User.upsert(user) // Don't await, let it be async
  return jwt.generate(user.id, data.access_token)
}

export const refreshToken = async (_, { token }) => {
  const athlete = await strava.getCurrentAthlete(token)
  const user = athleteToUser(athlete)
  User.upsert(user) // Don't await, let it be async
  return jwt.generate(user.id, token) // todo: don't re-encrypt token
}
