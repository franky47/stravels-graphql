import * as Sentry from '@sentry/node'
import { InjectedRequest } from './types'
import { Response, NextFunction } from 'express'
import { log } from './logger'

export default () => (
  error: Error,
  req: InjectedRequest,
  res: Response,
  next: NextFunction
) => {
  if (res.headersSent) {
    return next(error)
  }
  Sentry.captureException(error)
  log(error.message, {
    level: 'ERROR',
    category: 'APP',
    req,
    meta: {
      name: error.name,
      stack: error.stack
    }
  })
  res.status(500).json({
    error: 'Internal server error',
    details: error.message
  })
}
