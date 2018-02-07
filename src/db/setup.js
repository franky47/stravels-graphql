import './models'
import db from './sequelize'

export default () => db.sync({
  alter: true
})
