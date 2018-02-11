import express from 'express'
import bodyParser from 'body-parser'
import cors from 'cors'
import raven from 'raven'
import { extractJwtMiddleware } from './auth/jwt'
import graphqlServer from './graphql/server'

const server = express()

server.use(cors())

// Enable Sentry error tracking
if (process.env.SENTRY_DSN) {
  server.use(raven.requestHandler())
}

server.use('/graphql',
  bodyParser.json(),
  extractJwtMiddleware(),
  graphqlServer()
)

// Report errors to Sentry
if (process.env.SENTRY_DSN) {
  server.use(raven.errorHandler())
}

export default {
  start: () => {
    const port = process.env.PORT || 3000
    server.listen(port, () => {
      console.log(`GraphQL Server is now running on http://localhost:${port}/graphql`)
    })
  }
}
