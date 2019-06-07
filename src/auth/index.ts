import { Jwt, generateJwt } from './jwt'
import { exchangeToken, deauthorize, StravaAuth } from '../services/strava'
import User from '../db/models/User'

export const loginWithCode = async (code: string): Promise<Jwt> => {
  const auth = await exchangeToken(code)
  await User.create({ id: auth.userId })
  return await generateJwt(auth)
}

export const logout = async (auth: StravaAuth) => {
  await deauthorize(auth.accessToken)
}

export const deleteAccount = async (userId: number) => {
  await User.destroy({ where: { id: userId } })
}
