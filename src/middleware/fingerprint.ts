import crypto from 'crypto'
import nanoid from 'nanoid'
import { Response, NextFunction } from 'express'
import { InjectedRequest } from './types'

export default (salt: string = '') => (
  req: InjectedRequest,
  _: Response,
  next: NextFunction
) => {
  const hash = crypto.createHash('sha256')
  hash.update(req.ip)
  hash.update(req.headers['user-agent'] || '')
  hash.update(salt)
  req.fingerprint = hash
    .digest('base64')
    .slice(0, 16)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
  // Generate unique ID for the request
  req.id = nanoid()
  next()
}
