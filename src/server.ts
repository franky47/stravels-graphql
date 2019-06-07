import { Server } from 'http'
import express, { Express, Request, Response } from 'express'
import gracefulExit from 'express-graceful-exit'
import helmet from 'helmet'
import compression from 'compression'
import logger, { log } from './middleware/logger'
import fingerprint from './middleware/fingerprint'
import extractJwt from './middleware/extractJwt'
import { attachGraphQLServer } from './graphql/index'
import { __DEV__ } from './config'
import authRoutes from './routes/auth'
import errorHandler from './middleware/errorHandler'
import { NextFunction } from 'connect'

// --

export interface AppServer extends Server {
  host: string
  port: string | number
}

// --

const ignoreCleverCloudHealthCheck = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (req.headers['X-CleverCloud-Monitoring'] === 'telegraf') {
    return res.sendStatus(204) // No content
  }
  next()
}

// --

export const createApplication = () => {
  const app = express()
  app.enable('trust proxy')

  // Load middlewares --

  // - Logging
  app.use(fingerprint(process.env.FINGERPRINT_SALT))
  app.use(logger())

  // - Body parsers
  app.use(express.json())
  app.use(express.urlencoded({ extended: true }))

  // Utility
  app.use(gracefulExit.middleware(app))
  app.use(helmet())
  app.use(compression())

  // Auth
  app.use(extractJwt())

  attachGraphQLServer(app)

  // Mount routes --

  app.get('/', ignoreCleverCloudHealthCheck, (req, res) => {
    res.send('Normal response')
  })

  app.use('/auth', authRoutes)

  app.use(errorHandler())

  return app
}

// --

export const startServer = async (app: Express): Promise<AppServer> => {
  const host = process.env.HOST || '0.0.0.0'
  const port = process.env.PORT || 3000
  return new Promise(resolve => {
    let server = app.listen(port, () => {
      // Graceful shutdown handler
      const handleSignal = (signal: NodeJS.Signals) => {
        log(`${signal} received, shutting down gracefully`, {
          level: 'INFO',
          category: 'APP',
          meta: {
            signal
          }
        })
        app.emit('stop')
        gracefulExit.gracefulExitHandler(app, server, {
          log: true,
          exitProcess: true,
          suicideTimeout: 10000, // 10 seconds
          logger: (message: any) => {
            log(message, {
              level: 'INFO',
              category: 'APP',
              meta: {
                signal
              }
            })
          },
          callback: (statusCode: any) => {
            log(`Bye bye`, {
              level: 'INFO',
              category: 'APP',
              meta: {
                statusCode,
                signal
              }
            })
          }
        })
      }
      process
        .on('SIGINT', handleSignal)
        .on('SIGABRT', handleSignal)
        .on('SIGTERM', handleSignal)

      if (__DEV__) {
        // For nodemon
        process.on('SIGUSR2', handleSignal)
      }

      resolve(Object.assign({ port, host }, server))
    })
  })
}
