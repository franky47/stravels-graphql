import crypto from 'crypto'
import jsonwebtoken from 'jsonwebtoken'

const encrypt = (text) => {
  const cipher = crypto.createCipher('aes-256-ctr', process.env.JWT_SECRET)
  const crypted = cipher.update(text, 'utf8', 'hex')
  return crypted + cipher.final('hex')
}

const decrypt = (cipher) => {
  const decipher = crypto.createDecipher('aes-256-ctr', process.env.JWT_SECRET)
  const dec = decipher.update(cipher, 'utf8', 'hex')
  return dec + decipher.final('utf8')
}

// --

const jwtOptions = {
  issuer: 'stravels-graphql',
  expiresIn: 5 // 4.. 3.. 2.. 1..
}

const generate = (userId, token) => new Promise((resolve, reject) => {
  const payload = {
    uid: userId,
    tkn: encrypt(token)
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
    token: decrypt(payload.tkn)
  }
}

// --

export default {
  generate,
  validate
}
