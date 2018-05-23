import moment from 'moment-timezone'
import { getPolylineUrl } from '../services/mapboxStatic'

const filter = (obj = {}, keys = []) =>
  keys.reduce((out, k) => {
    out[k] = obj[k]
    return out
  }, {})

const encodeLatLng = ([lat, lng]) => `${lat}|${lng}`

// Strava to Stravels data transforms --

export const athleteToUser = athlete => ({
  ...filter(athlete, ['id', 'email', 'username']),
  firstName: athlete.firstname,
  lastName: athlete.lastname,
  fullName: `${athlete.firstname} ${athlete.lastname}`,
  profilePicture:
    athlete.profile && athlete.profile.startsWith('http')
      ? athlete.profile
      : null
})

export const transformActivity = data => ({
  ...filter(data, ['id', 'name', 'distance']),
  date: data.start_date,
  elevation: data.total_elevation_gain,
  polyline: (data.map || {}).summary_polyline || null,
  startLatLng: data.start_latlng && encodeLatLng(data.start_latlng),
  endLatLng: data.end_latlng && encodeLatLng(data.end_latlng),

  // Stats
  movingTime: data.moving_time,
  averageSpeed: data.average_speed,
  maxSpeed: data.max_speed
})

// GraphQL field methods resolvers injection --

export const resolveUser = user => ({
  ...user,
  fullName: user.fullName || `${user.firstName} ${user.lastName}`
})

export const resolveActivity = activity => ({
  ...activity,
  title: activity.name,
  date: ({ tz }) =>
    tz
      ? moment(activity.date)
          .tz(tz)
          .format()
      : activity.date,
  thumbnailUrl: ({ retina, size }) =>
    getPolylineUrl(activity.polyline, {
      retina,
      width: size,
      height: size,
      mapId: 'mapbox.light',
      strokeColor: '2c2'
    })
})

// Filters --

const travelCompatibleActivities = [
  'Ride',
  'Run',
  'Walk',
  'Hike',
  'Backcountry Ski',
  'Nordic Ski',
  'Snowshoe',
  'Canoe',
  'Kayak',
  'Handcycle',
  'Inline Skate'
]

const isActivityPrivate = activity => !activity.private
const isCommute = activity => activity.commute
const isTravelCompatible = activity =>
  travelCompatibleActivities.includes(activity.type)

export const activityFilter = activity =>
  !isActivityPrivate(activity) &&
  !isCommute(activity) &&
  isTravelCompatible(activity)
