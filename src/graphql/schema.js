import { makeExecutableSchema } from 'graphql-tools'
import typeDefs from './schema.graphql'

// Queries
import getCurrentUser from './queries/me'
import {
  getActivities,
  getActivityById
} from './queries/activities'

// Mutations
import {
  loginWithCode,
  refreshToken,
  logout
} from './mutations/auth'

// --

const resolvers = {
  Query: {
    me: getCurrentUser,
    activities: getActivities,
    activity: getActivityById
  },
  Mutation: {
    loginWithCode,
    refreshToken,
    logout
  }
}

export default makeExecutableSchema({
  typeDefs,
  resolvers
})
