import { exchangeToken } from '../auth'
import { User } from '../db/models'
import strava from '../stravaApi'
import { athleteToUser } from '../transforms'

export const loginWithCode = async (_, { code }) => {
  const { token, user } = await exchangeToken(code)
  User.upsert(user) // Don't await, let it be async
  return token
}

export const loginWithToken = async (_, { token }) => {
  const athlete = await strava.getCurrentAthlete(token)
  const user = athleteToUser(athlete)
  await User.upsert(user)
  return user
}
