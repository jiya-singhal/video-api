const { Sequelize, DataTypes } = require('sequelize');
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './database.sqlite'
});

// Define the User model
const User = sequelize.define('User', {
  username: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  }
}, {
  timestamps: false
});

// Sync database
sequelize.sync();

async function addUser(username, password) {
  return User.create({ username, password });
}

async function findUser(username) {
  return User.findOne({ where: { username } });
}

module.exports = { addUser, findUser };
