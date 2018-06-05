import { makeExecutableSchema } from 'graphql-tools'
import gql from 'graphql-tag'

// Queries
import getCurrentUser from './queries/me'
import { getActivities, getActivityById } from './queries/activities'

// Mutations
import { loginWithCode, refreshToken, logout } from './mutations/auth'

// Schema ----------------------------------------------------------------------

const typeDefs = gql`
  scalar AuthenticationCode # Strava OAuth redirect code

  scalar JWT

  scalar Date

  type User {
    id: ID! @unique
    firstName: String
    lastName: String
    fullName: String
    profilePicture: String
    email: String
    travels: [Travel!]!
  }

  type Activity {
    id: ID! @unique
    title: String!
    date(tz: String): Date!
    distance: Float!
    elevation: Float!
    polyline: String!
    startLatLng: String
    endLatLng: String
    thumbnailUrl(retina: Boolean, size: Float, dark: Boolean): String
    type: String

    # Stats
    movingTime: Float!
    averageSpeed: Float!
    maxSpeed: Float!
  }

  type Travel {
    id: ID! @unique
    title: String
    urlSlug: String!
    author: User!
    activities: [Activity!]!
  }

  type TimeCursors {
    newest: Date
    oldest: Date
  }

  type PaginatedActivities {
    cursors: TimeCursors
    hasMore: Boolean
    activities: [Activity!]!
  }

  # Root Types --

  type Query {
    me: User

    # Activities Interfaces
    activities(before: Date): PaginatedActivities
    activity(id: ID!): Activity
  }

  type Mutation {
    # Auth
    loginWithCode(code: AuthenticationCode!): JWT
    refreshToken: JWT
    logout: String
  }
`

// -----------------------------------------------------------------------------

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
