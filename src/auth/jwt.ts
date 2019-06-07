import jsonwebtoken, { SignOptions } from 'jsonwebtoken'
import { AuthenticationError } from 'apollo-server-core'
import { StravaAuth, parseAuthFromJwt } from '../services/strava'
import { log } from '../middleware/logger'

// Defs --

export type Jwt = string

const jwtOptions: SignOptions = {
  algorithm: 'HS256',
  issuer: 'stravels-graphql'
}

export interface JwtPayloadInput {
  sub: number // Subject ID: Strava user ID
  atk: string // Strava access token (short-lived, clear text)
  rtk: string // Strava refresh token (long-lived, encrypted)
  // jti: string // JWT ID: Session code
}

export interface JwtPayload extends JwtPayloadInput {
  iss: string // Issuer
  iat: number // Issued at
  exp: number // Expires at
}

// Helpers --

// const checkSession = async (userId: number, code: string) => {
//   const session = await Session.findOne({
//     where: {
//       userId,
//       code
//     }
//   }).then(item => (item ? item.get({ plain: true }) : null))
//   if (!session) {
//     throw new AuthenticationError(
//       'Your session has expired. Login again to continue'
//     )
//   }
// }

// --

export const generateJwt = async (auth: StravaAuth): Promise<Jwt> =>
  new Promise((resolve, reject) => {
    const payload: JwtPayloadInput = {
      sub: auth.userId,
      rtk: auth.refreshToken,
      atk: auth.accessToken
    }
    const options: SignOptions = {
      ...jwtOptions,
      expiresIn: auth.expiresIn
    }
    jsonwebtoken.sign(
      payload,
      <string>process.env.JWT_SECRET,
      options,
      (err, jwt) => {
        if (err) {
          log('Failed to generate JWT', {
            level: 'ERROR',
            category: 'AUTH',
            meta: {
              payload,
              expiresIn: auth.expiresIn,
              error: err.message
            }
          })
          reject(err)
        } else {
          resolve(jwt)
        }
      }
    )
  })

// --

export const validateJwt = async (jwt: Jwt): Promise<StravaAuth> => {
  try {
    const payload = <JwtPayload>(
      jsonwebtoken.verify(jwt, <string>process.env.JWT_SECRET, jwtOptions)
    )
    // Valid token, check for valid session ID
    // await checkSession(payload.sub, payload.jti)
    return parseAuthFromJwt(payload)
  } catch (error) {
    // First, check invalid signature and return right away
    // Other cases of failure are related to JWT expiration
    log('Failed to validate JWT', {
      level: 'WARN',
      category: 'AUTH',
      meta: {
        jwt,
        error: error.message
      }
    })
    if (error.expiredAt) {
      // Expired JWT -> delete session
      throw new AuthenticationError(
        'Your session has expired. Login again to continue'
      )
    }
    throw new AuthenticationError(error.message)
  }
}
