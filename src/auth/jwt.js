import jsonwebtoken from 'jsonwebtoken'
import { Session } from '../db/models'
import { UnauthorizedError } from '../errors'

// Defs --

const jwtOptions = {
  issuer: 'stravels-graphql'
}

// Helpers --

const checkSession = async (userId, sessionCode) => {
  const session = await Session.findOne({
    where: {
      user: userId,
      code: sessionCode
    }
  }).then(item => item ? item.get({ plain: true }) : null)
  if (!session) {
    throw new UnauthorizedError({
      data: {
        reason: 'Your session has expired. Login again to continue'
      }
    })
  }
}

// JWT Extraction Middleware --

export const extractJwtMiddleware = () => async (req, res, next) => {
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    req.jwt = req.headers.authorization.replace('Bearer ', '')
  } else {
    req.jwt = null
  }
  next()
}

// --

export const generate = (userId, stravaToken, sessionCode) => new Promise((resolve, reject) => {
  const payload = {
    sub: userId,
    tkn: stravaToken,
    jti: sessionCode
  }
  const options = {
    ...jwtOptions,
    expiresIn: '12h'
  }
  jsonwebtoken.sign(payload, process.env.JWT_SECRET, options, (err, jwt) => {
    if (err) {
      reject(err)
    } else {
      resolve(jwt)
    }
  })
})

// --

export const validate = async (jwt) => {
  try {
    var payload = jsonwebtoken.verify(jwt, process.env.JWT_SECRET, jwtOptions)
  } catch (error) {
    throw new UnauthorizedError({
      data: {
        reason: error.message
      }
    })
  }
  // Valid token, check for valid session ID
  if (!process.env.DEBUG_DISABLE_SESSION_CHECK) {
    await checkSession(payload.sub, payload.jti)
  }
  return {
    userId: payload.sub,
    stravaToken: payload.tkn
  }
}

// --

export const refresh = async (jwt) => {
  const options = {
    ...jwtOptions,
    ignoreExpiration: true
  }
  try {
    var { sub, tkn, jti } = jsonwebtoken.verify(jwt, process.env.JWT_SECRET, options)
  } catch (error) {
    // Possible reasons: invalid signature, issuer mismatch, ...
    throw new UnauthorizedError({
      data: {
        reason: error.message
      }
    })
  }
  await checkSession(sub, jti) // Will throw if no valid session found
  return generate(sub, tkn, jti)
}
