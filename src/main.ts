require('dotenv').config()

import * as Sentry from '@sentry/node'
import { checkConfig, instanceId, __PROD__ } from './config'
import initDatabase from './db'
import { createApplication, startServer } from './server'
import { log } from './middleware/logger'

export default async function main() {
  log('App is starting', {
    category: 'INIT',
    level: 'INFO',
    meta: {
      environment: process.env.NODE_ENV,
      logLevel: process.env.LOG_LEVEL
    }
  })
  checkConfig()

  if (__PROD__) {
    // Setup Sentry error tracking
    // init will automatically find process.env.SENTRY_DSN if set
    Sentry.init({
      release: process.env.COMMIT_ID,
      environment: instanceId
    })
  }

  await initDatabase()
  const app = createApplication()
  const server = await startServer(app)

  log('App is ready to receive connections', {
    category: 'INIT',
    level: 'INFO',
    meta: {
      host: server.host,
      port: server.port
    }
  })
}

if (require.main === module) {
  main()
}
