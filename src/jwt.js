import jsonwebtoken from 'jsonwebtoken'

const jwtOptions = {
  issuer: 'stravels-graphql',
  expiresIn: '12h'
}

const generate = (userId, token) => new Promise((resolve, reject) => {
  const payload = {
    uid: userId,
    tkn: token
  }
  jsonwebtoken.sign(payload, process.env.JWT_SECRET, jwtOptions, (err, jwt) => {
    if (err) {
      reject(err)
    } else {
      resolve(jwt)
    }
  })
})

const validate = (jwt) => {
  const payload = jsonwebtoken.verify(jwt, process.env.JWT_SECRET, jwtOptions)
  return {
    userId: payload.uid,
    token: payload.tkn
  }
}

// --

export default {
  generate,
  validate
}
