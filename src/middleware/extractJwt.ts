import { Response, NextFunction } from 'express'
import { InjectedRequest } from './types'

export default () => (
  req: InjectedRequest,
  _: Response,
  next: NextFunction
) => {
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer ')
  ) {
    req.jwt = req.headers.authorization.replace('Bearer ', '')
  } else {
    req.jwt = undefined
  }
  next()
}
