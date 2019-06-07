import { Sequelize } from 'sequelize'
import { defineUsers, seedUsers } from './models/User'
import { log } from '../middleware/logger'
import { __DEV__ } from '../config'
// import { defineSessions, seedSessions } from './models/Session'

export interface Db {
  sequelize: Sequelize
  Sequelize: typeof Sequelize
}

export default async function initDatabase(): Promise<Db> {
  const uri = <string>process.env.POSTGRESQL_ADDON_URI
  const sequelize = new Sequelize(uri, {
    logging: (sql: string) => {
      log(sql, {
        level: 'DEBUG',
        category: 'DB'
      })
    },
    define: {
      timestamps: true
    }
  })
  await sequelize.authenticate()
  log('Database is online', {
    level: 'INFO',
    category: 'INIT'
  })

  // Define models
  defineUsers(sequelize)
  // defineSessions(sequelize)

  await sequelize.sync({
    force: __DEV__ && process.env.DATABASE_FORCE_SYNC === 'true'
  })

  const db: Db = {
    sequelize,
    Sequelize
  }

  if (__DEV__ && process.env.DATABASE_SEED === 'true') {
    await seedUsers()
    // await seedSessions()
  }

  return db
}
