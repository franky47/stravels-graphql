import jsonwebtoken from 'jsonwebtoken'
import { Session } from './db/models'

const jwtOptions = {
  issuer: 'stravels-graphql'
}

export const generate = (userId, token, sessionId) => new Promise((resolve, reject) => {
  const payload = {
    uid: userId,
    tkn: token,
    sid: sessionId
  }
  const options = {
    ...jwtOptions,
    expiresIn: '12h' // default: 12h
  }
  jsonwebtoken.sign(payload, process.env.JWT_SECRET, options, (err, jwt) => {
    if (err) {
      reject(err)
    } else {
      resolve(jwt)
    }
  })
})

export const validate = async (jwt) => {
  try {
    var payload = jsonwebtoken.verify(jwt, process.env.JWT_SECRET, jwtOptions)
  } catch (error) {
    return null
  }
  // Valid token, check for valid session ID
  const session = await Session.findOne({
    where: {
      user: payload.uid,
      code: payload.sid
    }
  }).then(item => item ? item.get({ plain: true }) : null)
  if (!session) {
    return null
  }
  return {
    userId: payload.uid,
    token: payload.tkn
  }
}

export const refresh = async (jwt) => {
  const options = {
    ...jwtOptions,
    ignoreExpiration: true
  }
  const { uid, tkn, sid } = jsonwebtoken.verify(jwt, process.env.JWT_SECRET, options)
  const session = await Session.findOne({
    where: {
      user: uid,
      code: sid
    }
  }).then(item => item ? item.get({ plain: true }) : null)
  if (!session) {
    return null
  }
  return generate(uid, tkn, sid)
}

// --

export default {
  generate,
  validate,
  refresh
}
