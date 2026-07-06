const { Sequelize } = require('sequelize');

// Your live hosted Neon PostgreSQL database connection string URL
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_fKh5TUQdWIy4@ep-polished-art-ah7dl409-pooler.c-3.us-east-1.aws.neon.tech/neondb';

// Determine if we should use SSL. For local/self-hosted databases, this is often false.
const useSSL = process.env.DB_SSL === 'true' || (DATABASE_URL.includes('neon.tech') && process.env.DB_SSL !== 'false');

const sequelize = new Sequelize(DATABASE_URL, {
  dialect: 'postgres',
  logging: false, // Prevents terminal console log clutter
  dialectOptions: {
    ssl: useSSL ? {
      require: true,
      rejectUnauthorized: false,
    } : false,
  },
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
});

module.exports = sequelize;