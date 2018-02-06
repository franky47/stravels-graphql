import me from './me'
import { getAllActivities, getActivityById } from './activities'

export default {
  me,
  travels: () => ({}),
  travel: () => ({}),
  activities: getAllActivities,
  activity: getActivityById
}
