import strava from '../stravaApi'
import { User } from '../db/models'
import { athleteToUser } from '../transforms'

// --

export const loginWithCode = async (_, { code }) => {
  const { access_token, athlete } = await strava.exchangeToken(code)
  const user = athleteToUser(athlete)
  User.upsert(user) // Don't await, let it be async
  return {
    id: user.id,
    token: access_token
  }
}

export const loginWithToken = async (_, { token }) => {
  const athlete = await strava.getCurrentAthlete(token)
  const user = athleteToUser(athlete)
  User.upsert(user) // Don't await, let it be async
  return {
    id: user.id,
    token
  }
}
