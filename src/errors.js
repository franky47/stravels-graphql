import { createError } from 'apollo-errors'

export const UnknownError = createError('UnknownError', {
  message: 'An unknown error has occured'
})

export const UnauthorizedError = createError('UnauthorizedError', {
  message: 'You are not authorized to do that'
})

export const AlreadyAuthenticatedError = createError('AlreadyAuthenticatedError', {
  message: 'You are already authenticated'
})

export const StravaApiError = createError('StravaApiError', {
  message: 'Error with the Strava service'
})
