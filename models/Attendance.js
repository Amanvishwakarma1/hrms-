const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Attendance = sequelize.define('Attendance', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  userName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  date: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  checkIn: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  checkOut: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  workingHours: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  coords: {
    type: DataTypes.JSON,
    allowNull: true,
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: true,
  }
}, {
  timestamps: true,
});

module.exports = Attendance;
