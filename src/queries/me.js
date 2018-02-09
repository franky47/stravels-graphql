import strava from '../stravaApi'
import { athleteToUser, resolveUser } from '../transforms'
// import { User } from '../db/models'

// Strava API Query version
export default async (root, args, context, info) => {
  if (!context.token) {
    return new Error('Unauthorized: missing, expired or invalid token')
  }
  const athlete = await strava.getCurrentAthlete(context.token)
  return resolveUser(athleteToUser(athlete))
}

// Database query version
// export default async (root, args, context, info) => {
//   if (!context.userId) {
//     return new Error('Unauthorized: missing, expired or invalid token')
//   }
//   return User.findById(context.userId)
//     .then(user => user.get({ plain: true }))
//     .then(resolveUser)
// }
