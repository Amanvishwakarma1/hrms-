const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Employee = sequelize.define('Employee', {
  id: {
    type: DataTypes.STRING,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'password123',
  },
  role: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'EMPLOYEE', // 'ADMIN' or 'EMPLOYEE'
  },
  designation: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'OFFICE', // 'OFFICE' or 'FIELD'
  },
  allowedLeaves: {
    type: DataTypes.INTEGER,
    field: 'allowed_leaves',
    allowNull: false,
    defaultValue: 15,
  },
  consumedLeaves: {
    type: DataTypes.INTEGER,
    field: 'consumed_leaves',
    allowNull: false,
    defaultValue: 0,
  }
}, {
  tableName: 'location_employees',
  timestamps: true,
  underscored: true
});

module.exports = Employee;
