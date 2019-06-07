import { ApolloServer, gql } from 'apollo-server-express'
import { Express } from 'express'
//import { typeDefs, resolvers } from './schema'

const typeDefs = gql`
  type Query {
    "A simple type for getting started!"
    hello: String
  }
`

// A map of functions which return data for the schema.
const resolvers = {
  Query: {
    hello: () => 'world'
  }
}

export const attachGraphQLServer = (app: Express) => {
  const server = new ApolloServer({
    // These will be defined for both new or existing servers
    typeDefs,
    resolvers
  })
  server.applyMiddleware({ app })
  return server
}
