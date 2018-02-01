import express from 'express'
import { graphqlExpress } from 'apollo-server-express'
import bodyParser from 'body-parser'
import cors from 'cors'
import chalk from 'chalk'

import * as Schema from './schema'
import setupDatabase from './db/setup'

const PORT = 3000
const server = express()

if (typeof process.env.APOLLO_ENGINE_KEY === 'undefined') {
  console.warn(chalk.yellow('WARNING: process.env.APOLLO_ENGINE_KEY is not defined. Check README.md for more information'))
}

let schema
const schemaFunction = Schema.schemaFunction || (() => Schema.schema)
const rootFunction = Schema.rootFunction || (() => schema.rootValue)
const contextFunction = Schema.context || ((headers, secrets) => ({
  headers,
  ...secrets
}))

server.use(cors())

server.use('/graphql', bodyParser.json(), graphqlExpress(async (request) => {
  if (!schema) {
    schema = schemaFunction(process.env)
  }
  const context = await contextFunction(request.headers, process.env)
  const rootValue = await rootFunction(request.headers, process.env)

  return {
    schema: await schema,
    rootValue,
    context,
    tracing: true
  }
}))

setupDatabase()
  .then(() => {
    server.listen(PORT, () => {
      console.log(chalk.green(`GraphQL Server is now running on http://localhost:${PORT}/graphql`))
    })
  })
