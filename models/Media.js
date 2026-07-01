const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Media = sequelize.define('Media', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.STRING,
    field: 'user_id',
    allowNull: false,
  },
  userName: {
    type: DataTypes.STRING,
    field: 'user_name',
    allowNull: false,
  },
  filePath: {
    type: DataTypes.STRING,
    field: 'file_path',
    allowNull: false,
  },
  mediaType: {
    type: DataTypes.STRING,
    field: 'media_type',
    allowNull: false, // 'image' or 'video'
  },
  latitude: {
    type: DataTypes.FLOAT,
    allowNull: true,
  },
  longitude: {
    type: DataTypes.FLOAT,
    allowNull: true,
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  cloudinaryUrl: {
    type: DataTypes.STRING,
    field: 'cloudinary_url',
    allowNull: true,
  },
  timestamp: {
    type: DataTypes.BIGINT,
    allowNull: false,
  },
  date: {
    type: DataTypes.STRING,
    allowNull: false,
  }
}, {
  tableName: 'geotagged_media',
  timestamps: true,
  underscored: true
});

module.exports = Media;
