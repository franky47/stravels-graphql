import checkEnv from '@47ng/check-env'
import { log, color } from './middleware/logger'

export const __DEV__ = process.env.NODE_ENV === 'development'
export const __PROD__ = process.env.NODE_ENV === 'production'

// --

export const instanceId = [
  process.env.APP_NAME,
  (process.env.INSTANCE_ID || 'dev').slice(0, 8),
  process.env.INSTANCE_NUMBER || '0'
].join('.')

// --

export const checkConfig = () => {
  checkEnv({
    required: [
      'APP_NAME',
      'POSTGRESQL_ADDON_URI',
      'STRAVA_CLIENT_ID',
      'STRAVA_CLIENT_SECRET',
      'JWT_SECRET',
      'AES_KEY_PASSWORD'
      // 'MAPBOX_ACCESS_TOKEN'
    ],
    optional: ['SENTRY_DSN'],
    logError: (name: string) => {
      log(`Missing required environment variable ${color.red(name)}`, {
        level: 'ERROR',
        category: 'INIT'
      })
    },
    logWarning: (name: string) => {
      log(`Missing optional environment variable ${color.yellow(name)}`, {
        level: 'WARN',
        category: 'INIT'
      })
    }
  })
}
