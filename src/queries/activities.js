import strava from '../stravaApi'
import { transformActivity, resolveActivity } from '../transforms'

export const getAllActivities = async (root, args, context) => {
  const activities = await strava.getAllActivities(context.token)
  return activities
    .map(transformActivity)
    .map(resolveActivity)
}

export const getActivityById = async (_, { id }, context) => {
  const activity = await strava.getActivity(context.token, id)
  return resolveActivity(transformActivity(activity))
}
