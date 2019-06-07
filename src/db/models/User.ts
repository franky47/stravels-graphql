import * as Sequelize from 'sequelize'

export default class User extends Sequelize.Model {
  public id!: number // The Strava user ID
  public username!: string
  public firstName!: string
  public lastName!: string
  public profilePicture!: string
  public email!: string

  // Timestamps
  public readonly createdAt!: Date
  public readonly lastLogin!: Date
}

export const defineUsers = (db: Sequelize.Sequelize) => {
  User.init(
    {
      id: {
        // The Strava user id
        type: Sequelize.INTEGER,
        primaryKey: true
      },
      username: {
        type: Sequelize.STRING
      },
      firstName: {
        type: Sequelize.STRING
      },
      lastName: {
        type: Sequelize.STRING
      },
      profilePicture: {
        type: Sequelize.STRING,
        validate: {
          isUrl: true
        }
      },
      email: {
        type: Sequelize.STRING,
        validate: {
          isEmail: true
        }
      }
    },
    {
      sequelize: db,
      modelName: 'user',
      tableName: 'users',
      updatedAt: 'lastLogin',
      indexes: [
        {
          unique: true,
          fields: ['id', 'username', 'email']
        }
      ]
    }
  )
}

export const seedUsers = async () => {
  await User.create({
    id: 123456,
    username: 'jdoe',
    firstName: 'John',
    lastName: 'Doe',
    profilePicture: null,
    email: 'john.doe@example.com'
  })
  await User.create({
    id: 654321,
    username: 'janed',
    firstName: 'Jane',
    lastName: 'Doe',
    profilePicture: null,
    email: 'jane.doe@example.com'
  })
}
