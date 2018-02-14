import crypto from 'crypto'
import strava from '../../services/strava'
import {
  generate as generateJwt,
  refresh as refreshJwt
} from '../../auth/jwt'
import { User, Session } from '../../db/models'
import { athleteToUser } from '../transforms'
import { authenticated } from '../resolvers'

export const loginWithCode = async (_, { code }) => {
  const data = await strava.exchangeToken(code)
  const user = athleteToUser(data.athlete)
  const sessionCode = crypto.randomBytes(16).toString('hex')
  // todo: pack these in a single roundtrip to DB
  await User.upsert(user)
  await Session.create({
    user: user.id,
    code: sessionCode
  })
  return generateJwt(user.id, data.access_token, sessionCode)
}

export const refreshToken = async (_, args, context) => {
  return refreshJwt(context.jwt)
}

// Logout from all sessions
export const logout = authenticated.createResolver(async (_, args, context) => {
  return Session.destroy({
    where: {
      user: context.userId
    }
  }).then(() => 'Successfully logged out of all sessions')
})
