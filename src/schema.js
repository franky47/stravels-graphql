// Welcome to Launchpad!
// Log in to edit and save pads, run queries in GraphiQL on the right.
// Click "Download" above to get a zip with a standalone Node.js server.
// See docs and examples at https://github.com/apollographql/awesome-launchpad

// graphql-tools combines a schema string with resolvers.
import { makeExecutableSchema } from 'graphql-tools'
import axios from 'axios'
import moment from 'moment-timezone'
import { exchangeToken } from './auth'

const strava = axios.create({
  baseURL: 'https://www.strava.com/api/v3'
})
const stravels = axios.create({
  baseURL: 'https://wt-92cccbcf027a1b4070443ff04b9033cc-0.sandbox.auth0-extend.com/stravels-sandbox'
})

const injectAuthHeader = (context) => ({
  headers: {
    Authorization: context.headers.authorization
  }
})

// Construct a schema, using GraphQL schema language
const typeDefs = `
  scalar Token

  enum DISTANCE_UNIT {
    METERS
    KILOMETERS
  }

  type User {
    id: ID! @unique
    firstName: String
    lastName: String
    fullName: String
    profilePicture: String!
    email: String
    travels: [Travel!]!
  }

  type Activity {
    id: ID! @unique
    name: String!
    date(tz: String): String!
    distance(unit: DISTANCE_UNIT = METERS): Float!
    elevation: Float!
    polyline: String!
  }

  type Travel {
    id: ID! @unique
    name: String
    urlSlug: String!
    author: User!
    activities: [Activity!]!
  }

  type Query {
    me: User
    travel(id: ID!): Travel
    activity(id: ID!): Activity
    activities(last: Int): [Activity!]
    publicTravels: [Travel!]!
  }

  type Mutation {
    login(code: String!): Token
  }
`

const formatDate = (date) =>
  ({ tz }) => tz ? moment(date).tz(tz).format() : date

const formatActivity = (data) => ({
  ...data,
  date: formatDate(data.date || data.start_date),
  distance: ({ unit }) => {
    return data.distance * (unit === 'KILOMETERS' ? 0.001 : 1.0)
  },
  elevation: data.elevation || data.total_elevation_gain,
  polyline: data.polyline || data.map.summary_polyline
})

// Provide resolver functions for your schema fields
const resolvers = {
  Query: {
    async me (root, args, context) {
      const { data } = await strava.get('/athlete', injectAuthHeader(context))
      return {
        id: data.id,
        firstName: data.firstname,
        lastName: data.lastname,
        fullName: `${data.firstname} ${data.lastname}`,
        profilePicture: data.profile,
        travels: await stravels
          .get(`/travels`, injectAuthHeader(context))
          .then(res => res.data)
          .then(travels => travels.map(t => ({
            ...t,
            activities: t.activities.map(formatActivity)
          })))
      }
    },
    async travel (root, args, context) {
      if (!args.id) return null
      return stravels.get(`/travels/${args.id}`, injectAuthHeader(context))
        .then(res => res.data)
        .then(travel => ({
          ...travel,
          activities: travel.activities.map(formatActivity)
        }))
    },
    async activity (root, args, context) {
      if (!args.id) return null
      const { data } = await strava.get(`/activities/${args.id}`, injectAuthHeader(context))
      return formatActivity(data)
    },
    async activities (root, args, context) {
      const { data } = await strava.get('/athlete/activities', {
        ...injectAuthHeader(context),
        params: {
          per_page: args.last
        }
      })
      return data.map(formatActivity)
    },
    async publicTravels (root, args, context) {
      return []
    }
  },
  Mutation: {
    async login (root, { code }) {
      return exchangeToken(code)
    }
  }
}

// Required: Export the GraphQL.js schema object as "schema"
export const schema = makeExecutableSchema({
  typeDefs,
  resolvers
})

// Optional: Export a function to get context from the request. It accepts two
// parameters - headers (lowercased http headers) and secrets (secrets defined
// in secrets section). It must return an object (or a promise resolving to it).
export function context (headers, secrets) {
  return {
    headers,
    secrets
  }
};

// Optional: Export a root value to be passed during execution
// export const rootValue = {};

// Optional: Export a root function, that returns root to be passed
// during execution, accepting headers and secrets. It can return a
// promise. rootFunction takes precedence over rootValue.
// export function rootFunction(headers, secrets) {
//   return {
//     headers,
//     secrets,
//   };
// };
