import { makeExecutableSchema } from 'graphql-tools'
import typeDefs from './schema.graphql'
import Query from './queries'
import Mutation from './mutations'
import { validate as validateJwt } from './jwt'

// Provide resolver functions for your schema fields
const resolvers = {
  Query,
  Mutation
}

// Required: Export the GraphQL.js schema object as "schema"
export const schema = makeExecutableSchema({
  typeDefs,
  resolvers
})

const extractAndValidateJwt = async (headers) => {
  const jwt = (headers.authorization || '').slice('Bearer '.length)
  if (!jwt) {
    return null
  }
  try {
    return { ...await validateJwt(jwt), jwt }
  } catch (error) {
    return null
  }
}

// Optional: Export a function to get context from the request. It accepts two
// parameters - headers (lowercased http headers) and secrets (secrets defined
// in secrets section). It must return an object (or a promise resolving to it).
export async function context (headers, secrets) {
  const jwt = await extractAndValidateJwt(headers)
  return {
    headers,
    secrets,
    userId: jwt ? jwt.userId : null,
    token: jwt ? jwt.token : null,
    jwt: jwt ? jwt.jwt : null
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
