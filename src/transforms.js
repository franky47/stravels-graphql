import moment from 'moment-timezone'

export const filter = (obj = {}, keys = []) => keys.reduce((out, k) => {
  out[k] = obj[k]
  return out
}, {})

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
  polyline: (data.map || {}).summary_polyline || null
})

// GraphQL field methods resolvers injection --

export const resolveActivity = (activity) => ({
  ...activity,
  date: ({ tz }) => tz ? moment(activity.date).tz(tz).format() : activity.date,
  distance: ({ unit }) => activity.distance * (unit === 'KILOMETERS' ? 0.001 : 1.0)
})
