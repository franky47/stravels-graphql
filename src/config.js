import dotenv from 'dotenv'
import raven from 'raven'
import chalk from 'chalk'

// Setup environment variables
dotenv.config()

console.info(`Running in ${process.env.NODE_ENV}`)

const checkEnv = (varName, config = { optional: false }) => {
  if (!process.env[varName]) {
    if (config.optional) {
      console.warn(chalk.yellow(`Warning: ${varName} is not set`))
    } else {
      console.error(chalk.red(`Error: ${varName} is not set`))
    }
  }
}

// Required Application Setup
checkEnv('DATABASE_URI')
checkEnv('STRAVA_CLIENT_ID')
checkEnv('STRAVA_CLIENT_SECRET')
checkEnv('JWT_SECRET')
checkEnv('MAPBOX_ACCESS_TOKEN')

// Optional Tracking & helpers
checkEnv('SENTRY_DSN', { optional: true })

// Setup Sentry error tracking
if (process.env.SENTRY_DSN) {
  raven.config(process.env.SENTRY_DSN).install()
}

// Check for debugging envs in production --

const checkDebugEnvIsNotSetInProd = varName => {
  if (process.env.NODE_ENV === 'production' && process.env[varName]) {
    console.error(
      chalk.red(
        `Error: ${varName} is a debug-only variable and must not be set in production !`
      )
    )
    process.exit(1)
  }
  if (process.env[varName]) {
    console.warn(chalk.yellow(`Warning: ${varName} is set`))
  }
}

checkDebugEnvIsNotSetInProd('DEBUG_DISABLE_SESSION_CHECK')
checkDebugEnvIsNotSetInProd('DEBUG_USE_LOCAL_FIXTURES')
