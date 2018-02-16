import raven from 'raven'
import { createResolver } from 'apollo-resolvers'
import { isInstance } from 'apollo-errors'
import { InternalError } from '../errors'
import { validate as validateJwt } from '../auth/jwt'

const baseResolver = createResolver(
  null, // Don't process requests, let them through on the way down
  (root, args, context, error) => {
    raven.captureException(error)
    return isInstance(error) ? error : new InternalError({
      data: {
        details: error.message
      }
    })
  }
)

export const authenticated = baseResolver.createResolver(
  async (root, args, context) => {
    const { userId, stravaToken } = await validateJwt(context.jwt)
    context.userId = userId
    context.stravaToken = stravaToken
  }
)
