import crypto from 'crypto'

const algorithm: crypto.CipherGCMTypes = 'aes-128-gcm'
const algorithmKeyLength = 16

// --

const safetifyBase64 = (text: string) =>
  text
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/\=/g, '')

// --

export const hashString = (text: string) => {
  const hash = crypto.createHash('sha256')
  hash.update(text)
  return safetifyBase64(hash.digest('base64'))
}

// --

const generateKey = (salt: Buffer) =>
  new Promise<Buffer>((resolve, reject) => {
    const password = <string>process.env.AES_KEY_PASSWORD
    crypto.scrypt(password, salt, algorithmKeyLength, (err, derived) => {
      if (err) {
        reject(err)
      } else {
        resolve(derived)
      }
    })
  })

// --

export const encrypt = async (clearText: string) => {
  const iv = crypto.randomBytes(12)
  const salt = crypto.randomBytes(16)
  const key = await generateKey(salt)
  const cipher = crypto.createCipheriv(algorithm, key, iv)
  let encrypted = ''
  return new Promise<string>((resolve, reject) => {
    cipher.on('readable', () => {
      let chunk
      while (null !== (chunk = cipher.read())) {
        encrypted += chunk.toString('hex')
      }
    })
    cipher.on('end', () => {
      resolve(encrypted)
    })
    cipher.on('error', reject)
    try {
      cipher.write(clearText)
      cipher.end()
    } catch (error) {
      reject(error)
    }
  }).then(encrypted => {
    const s = safetifyBase64(salt.toString('base64'))
    const i = safetifyBase64(iv.toString('base64'))
    const e = safetifyBase64(Buffer.from(encrypted, 'hex').toString('base64'))
    const t = safetifyBase64(cipher.getAuthTag().toString('base64'))
    return `${s}.${i}.${e}.${t}`
  })
}

// --

export const decrypt = async (encrypted: string): Promise<string> => {
  const [s, i, e, t] = encrypted.split('.', 4)
  const salt = Buffer.from(s, 'base64')
  const iv = Buffer.from(i, 'base64')
  const tag = Buffer.from(t, 'base64')
  const key = await generateKey(salt)
  const decipher = crypto.createDecipheriv(algorithm, key, iv)
  decipher.setAuthTag(tag)
  return new Promise<string>((resolve, reject) => {
    let decrypted = ''
    decipher.on('readable', () => {
      let chunk
      while (null !== (chunk = decipher.read())) {
        decrypted += chunk.toString('utf8')
      }
    })
    decipher.on('end', () => {
      resolve(decrypted)
    })
    decipher.on('error', reject)
    try {
      decipher.write(e, 'base64')
      decipher.end()
    } catch (error) {
      reject(error)
    }
  })
}
