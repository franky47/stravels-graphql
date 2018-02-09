import express from 'express'
import { graphqlExpress } from 'apollo-server-express'
import bodyParser from 'body-parser'
import cors from 'cors'
import raven from 'raven'

import * as Schema from './schema'

const port = process.env.PORT || 3000
const server = express()

let schema
const schemaFunction = Schema.schemaFunction || (() => Schema.schema)
const rootFunction = Schema.rootFunction || (() => schema.rootValue)
const contextFunction = Schema.context || ((headers, secrets) => ({
  headers,
  ...secrets
}))

server.use(cors())

// Enable Sentry error tracking
if (process.env.SENTRY_DSN) {
  server.use(raven.requestHandler())
}

server.use('/graphql', bodyParser.json(), graphqlExpress(async (request) => {
  if (!schema) {
    schema = schemaFunction(process.env)
  }
  const context = await contextFunction(request.headers, process.env)
  const rootValue = await rootFunction(request.headers, process.env)

  return {
    schema: await schema,
    rootValue,
    context
  }
}))

// Report errors to Sentry
if (process.env.SENTRY_DSN) {
  server.use(raven.errorHandler())
}

export default {
  start: () =>
    server.listen(port, () => {
      console.log(`GraphQL Server is now running on http://localhost:${port}/graphql`)
    })
}
