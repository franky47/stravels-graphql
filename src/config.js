import dotenv from 'dotenv'
import raven from 'raven'

// Setup environment variables
dotenv.config()

// Setup Sentry error tracking
raven.config(process.env.SENTRY_DSN).install()
