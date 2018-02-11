import strava from '../../strava/api'
import { athleteToUser, resolveUser } from '../transforms'
import { authenticated } from '../resolvers'
// import { User } from '../db/models'

// Strava API Query version

export default authenticated.createResolver(async (root, args, context, info) => {
  const athlete = await strava.getCurrentAthlete(context.token)
  return resolveUser(athleteToUser(athlete))
})

// Database query version
// export default async (root, args, context, info) => {
//   if (!context.userId) {
//     return new Error('Unauthorized: missing, expired or invalid token')
//   }
//   return User.findById(context.userId)
//     .then(user => user.get({ plain: true }))
//     .then(resolveUser)
// }
