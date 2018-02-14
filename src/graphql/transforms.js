import moment from 'moment-timezone'
import { getPolylineUrl } from '../services/mapboxStatic'

const filter = (obj = {}, keys = []) => keys.reduce((out, k) => {
  out[k] = obj[k]
  return out
}, {})

const encodeLatLng = ([lat, lng]) => `${lat}|${lng}`

// Strava to Stravels data transforms --

export const athleteToUser = (athlete) => ({
  ...filter(athlete, ['id', 'email', 'username']),
  firstName: athlete.firstname,
  lastName: athlete.lastname,
  fullName: `${athlete.firstname} ${athlete.lastname}`,
  profilePicture: athlete.profile.startsWith('http') ? athlete.profile : null
})

export const transformActivity = (data) => ({
  ...filter(data, ['id', 'name', 'distance']),
  date: data.start_date,
  elevation: data.total_elevation_gain,
  polyline: (data.map || {}).summary_polyline || null,
  startLatLng: encodeLatLng(data.start_latlng),
  endLatLng: encodeLatLng(data.end_latlng)
})

// GraphQL field methods resolvers injection --

export const resolveUser = (user) => ({
  ...user,
  fullName: user.fullName || `${user.firstName} ${user.lastName}`
})

export const resolveActivity = (activity) => ({
  ...activity,
  title: activity.name,
  date: ({ tz }) => tz ? moment(activity.date).tz(tz).format() : activity.date,
  distance: ({ unit }) => activity.distance * (unit === 'KILOMETERS' ? 0.001 : 1.0),
  thumbnailUrl: ({ retina, size }) => getPolylineUrl(activity.polyline, {
    retina,
    width: size,
    height: size,
    mapId: 'mapbox.light',
    strokeColor: '2c2'
  })
})

// Filters --

export const activityFilter = (activity) =>
  activity.type === 'Ride' && !activity.private && !activity.commute
