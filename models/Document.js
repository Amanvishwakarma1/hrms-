const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Document = sequelize.define('Document', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  filePath: {
    type: DataTypes.STRING,
    field: 'file_path',
    allowNull: false,
  },
  uploaderId: {
    type: DataTypes.STRING,
    field: 'uploader_id',
    allowNull: false,
  },
  uploaderName: {
    type: DataTypes.STRING,
    field: 'uploader_name',
    allowNull: false,
  },
  targetType: {
    type: DataTypes.STRING,
    field: 'target_type', // 'ALL', 'INDIVIDUAL', or 'ADMIN'
    allowNull: false,
  },
  targetUserId: {
    type: DataTypes.STRING,
    field: 'target_user_id',
    allowNull: true,
  },
  targetUserName: {
    type: DataTypes.STRING,
    field: 'target_user_name',
    allowNull: true,
  },
  fileType: {
    type: DataTypes.STRING,
    field: 'file_type',
    allowNull: true,
  },
  fileSize: {
    type: DataTypes.INTEGER,
    field: 'file_size',
    allowNull: true,
  },
  uploadedAt: {
    type: DataTypes.BIGINT,
    field: 'uploaded_at',
    allowNull: false,
  }
}, {
  tableName: 'location_documents',
  timestamps: true,
  underscored: true
});

module.exports = Document;
