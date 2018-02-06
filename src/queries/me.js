import strava from '../stravaApi'
import { athleteToUser } from '../transforms'

export default async (root, args, context, info) => {
  const athlete = await strava.getCurrentAthlete(context.token)
  return athleteToUser(athlete)
}
