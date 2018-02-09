import strava from '../stravaApi'
import {
  transformActivity,
  resolveActivity,
  activityFilter
} from '../transforms'

/**
 * getActivities - Paginated endpoint for gettting Strava activity data.
 *
 * Pagination arguments:
 *   before       ISO-8601 formatted date string. Will return activities that
 *                happened before this date, exclusively.
 *                Useful for fetching more data at the end of a scroll list view.
 *                If not provided, it is considered equal to the Unix epoch.
 *
 *   after        ISO-8601 formatted date string. Will return activities that
 *                happened after this date, exclusively.
 *                Useful for getting the most up to date data.
 *                If not provided, it is considered equal to current time.
 */
export const getActivities = async (_, { before, after }, context) => {
  const options = {
    before: before ? new Date(before).getTime() / 1000 : undefined,
    after: after ? new Date(after).getTime() / 1000 : undefined
  }
  const activities = await strava.getActivities(context.token, options)
  if (after) {
    // From the Strava API docs:
    // [Activities] will be sorted oldest first if the `after` parameter is used.
    // -> if so, reverse the order to keep it consistent (newest first)
    activities.reverse()
  }
  return activities
    .filter(activityFilter)
    .map(transformActivity)
    .map(resolveActivity)
}

export const getActivityById = async (_, { id }, context) => {
  const activity = await strava.getActivity(context.token, id)
  return resolveActivity(transformActivity(activity))
}
