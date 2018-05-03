import strava from '../../services/strava'
import localStrava from '../../fixtures/localStrava'

import {
  transformActivity,
  resolveActivity,
  activityFilter
} from '../transforms'
import { authenticated } from '../resolvers'

const recurseGetActivitiesBefore = async (token, initialBefore) => {
  const state = {
    newest: null,
    oldest: null,
    numActivities: 30,
    raw: [],
    filtered: []
  }
  const recurse = async before => {
    const options = {
      before: before ? new Date(before).getTime() / 1000 : undefined,
      pageSize: state.numActivities
    }
    const activities = await strava.getActivities(token, options)
    if (activities.length === 0) {
      return
    }
    const filtered = activities.filter(activityFilter)
    // Update state
    state.raw += activities
    state.newest = state.newest ? state.newest : activities[0].start_date
    state.oldest = activities[activities.length - 1].start_date
    state.filtered = [...state.filtered, ...filtered]
    if (filtered.length < 5) {
      state.numActivities = Math.min(100, state.numActivities + 20)
      await recurse(state.oldest)
    }
  }
  await recurse(initialBefore)
  return state
}

/**
 * getActivities - Paginated endpoint for gettting Strava activity data.
 *
 * Pagination arguments:
 *   before       ISO-8601 formatted date string. Will return activities that
 *                happened before this date, exclusively.
 *                Useful for fetching more data at the end of a scroll list view.
 *                If not provided, it is considered equal to the current time.
 */
export const getActivities = authenticated.createResolver(
  async (_, { before }, context) => {
    let state = {}
    if (process.env.DEBUG_USE_LOCAL_FIXTURES) {
      state.raw = await localStrava.getActivities(context.userId)
      state.filtered = state.raw.filter(activityFilter)
      state.newest = state.raw.length ? state.raw[0].start_date : null
      state.oldest = state.raw.length
        ? state.raw[state.raw.length - 1].start_date
        : null
    } else {
      state = await recurseGetActivitiesBefore(context.stravaToken, before)
    }
    return {
      cursors: {
        newest: state.newest,
        oldest: state.oldest
      },
      hasMore: state.raw.length > 0,
      activities: state.filtered.map(transformActivity).map(resolveActivity)
    }
  }
)

export const getActivityById = authenticated.createResolver(
  async (_, { id }, context) => {
    const activity = await strava.getActivity(context.stravaToken, id)
    return resolveActivity(transformActivity(activity))
  }
)
