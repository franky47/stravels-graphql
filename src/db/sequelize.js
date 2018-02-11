import Sequelize from 'sequelize'
import chalk from 'chalk'

const db = new Sequelize(process.env.DATABASE_URI, {
  operatorsAliases: false,
  logging: false
})

db.authenticate()
  .then(() => {
    console.info('Connection to the database established successfully.')
  })
  .catch(error => {
    console.error(chalk.red('Unable to connect to the database:'), error)
  })

export default db
