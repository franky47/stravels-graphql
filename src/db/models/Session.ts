import * as Sequelize from 'sequelize'
import crypto from 'crypto'
import User from './User'

export default class Session extends Sequelize.Model {
  public readonly id!: number
  public readonly code!: string

  // Timestamps
  public readonly createdAt!: Date
  public readonly updatedAt!: Date
}

export function defineSessions(db: Sequelize.Sequelize) {
  Session.init(
    {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      code: {
        type: Sequelize.STRING,
        allowNull: false,
        validate: {
          isAlphanumeric: true
        }
      }
    },
    {
      sequelize: db,
      modelName: 'session',
      tableName: 'sessions'
    }
  )
  Session.belongsTo(User, {
    targetKey: 'id',
    onDelete: 'CASCADE' // Delete all sessions belonging to user being deleted
  })
}

export const generateSessionCode = () => {
  return crypto.randomBytes(16).toString('hex')
}

export async function seedSessions() {
  const users = await User.findAll()
  await Promise.all(
    users.map(user =>
      Session.create({
        code: generateSessionCode(),
        userId: user.id
      })
    )
  )
}
