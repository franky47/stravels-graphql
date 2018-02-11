import crypto from 'crypto'
import strava from '../stravaApi'
import jwt from '../jwt'
import { User, Session } from '../db/models'
import { athleteToUser } from '../transforms'

export const loginWithCode = async (_, { code }) => {
  const data = await strava.exchangeToken(code)
  const user = athleteToUser(data.athlete)
  const sessionId = crypto.randomBytes(16).toString('hex')
  // todo: pack these in a single roundtrip to DB
  await User.upsert(user)
  await Session.create({
    user: user.id,
    code: sessionId
  })
  return jwt.generate(user.id, data.access_token, sessionId)
}

export const refreshToken = async (_, args, context) => {
  return jwt.refresh(context.jwt)
}

// Logout from all sessions (clears the session IDs)
export const logout = async (_, args, context) => {
  if (!context.userId) {
    return new Error('Unauthorized: missing, expired or invalid token')
  }
  return Session.destroy({
    where: {
      user: context.userId
    }
  }).then(() => 'Successfully logged out of all sessions')
}
