import jwt from 'jsonwebtoken'
import strava from '../stravaApi'
import { User } from '../db/models'
import { athleteToUser } from '../transforms'

const jwtOptions = {
  issuer: 'stravels-graphql',
  expiresIn: 5 // 4.. 3.. 2.. 1..
}

// --

export const loginWithCode = async (_, { code }) => {
  const data = await strava.exchangeToken(code)
  const user = athleteToUser(data.athlete)
  User.upsert(user) // Don't await, let it be async
  return jwt.sign({
    uid: user.id,
    tkn: data.access_token
  }, process.env.JWT_SECRET, jwtOptions)
}

export const refreshToken = async (_, { token }) => {
  const athlete = await strava.getCurrentAthlete(token)
  const user = athleteToUser(athlete)
  User.upsert(user) // Don't await, let it be async
  return jwt.sign({
    uid: user.id,
    tkn: token
  }, process.env.JWT_SECRET, jwtOptions)
}
