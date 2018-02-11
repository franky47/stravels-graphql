import { graphqlExpress } from 'apollo-server-express'
import { formatError } from 'apollo-errors'
import schema from './schema'

export default () => graphqlExpress((req) => {
  return {
    schema,
    context: {
      jwt: req.jwt // from extractJwtMiddleware
    },
    formatError
  }
})
