import Sequelize from 'sequelize'
import chalk from 'chalk'

if (!process.env.DATABASE_URI) {
  console.warn(chalk.yellow('WARNING: process.env.DATABASE_URI is not defined.'))
}

const db = new Sequelize(process.env.DATABASE_URI, {
  operatorsAliases: false
})

db.authenticate()
  .then(() => {
    console.info(chalk.green('Connection to the database established successfully.'))
  })
  .catch(error => {
    console.error(chalk.red('Unable to connect to the database:'), error)
  })

export default db
