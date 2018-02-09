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
}, {
  ...config,
  updatedAt: 'lastLogin',
  indexes: [
    {
      unique: true,
      fields: ['id', 'username', 'email']
    }
  ]
})

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
  title: {
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
  },
  previewImage: {
    type: Sequelize.STRING,
    validate: {
      isUrl: true
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
