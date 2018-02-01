import db from './sequelize'
import Sequelize from 'sequelize'

const config = {
  timestamps: true,
  paranoid: true
}

export const User = db.define('user', {
  id: {
    // The Strava user id
    type: Sequelize.INTEGER,
    primaryKey: true
  },
  firstName: {
    type: Sequelize.STRING
  },
  lastName: {
    type: Sequelize.STRING
  },
  profilePicture: {
    type: Sequelize.STRING,
    allowNull: false,
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
}, config)

export const Travel = db.define('travel', {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  urlSlug: {
    type: Sequelize.STRING,
    allowNull: false,
    validate: {
      is: /^[a-z\d-]+$/ // lowercase letters, numbers and dashes only
    }
  },
  name: {
    type: Sequelize.STRING,
    allowNull: false
  },
  user: {
    type: Sequelize.INTEGER,
    references: {
      model: User,
      key: 'id',
      deferrable: Sequelize.Deferrable.INITIALLY_IMMEDIATE
    }
  }
}, config)

export const Activity = db.define('activity', {
  id: {
    // The Strava activity ID
    type: Sequelize.INTEGER,
    primaryKey: true
  },
  travel: {
    type: Sequelize.INTEGER,
    references: {
      model: Travel,
      key: 'id',
      deferrable: Sequelize.Deferrable.INITIALLY_IMMEDIATE
    }
  }
}, config)
