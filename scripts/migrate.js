const sequelize = require('../config/database');

async function migrate() {
  try {
    console.log('Connecting to database and executing migrations...');
    await sequelize.query('ALTER TABLE location_footprints ADD COLUMN IF NOT EXISTS network_type VARCHAR(255);');
    await sequelize.query('ALTER TABLE location_footprints ADD COLUMN IF NOT EXISTS reason VARCHAR(255);');
    console.log('Migration completed successfully: network_type and reason columns added to location_footprints.');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrate();
