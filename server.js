require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const sequelize = require('./config/database');
const expenseRoutes = require('./routes/expense');
const attendanceRoutes = require('./routes/attendance');
const footprintRoutes = require('./routes/footprint');
const mediaRoutes = require('./routes/media');
const leaveRoutes = require('./routes/leave');
const documentRoutes = require('./routes/document');
const authRoutes = require('./routes/auth');
const employeeRoutes = require('./routes/employee');
const geofenceRoutes = require('./routes/geofence');


const app = express();
const PORT = process.env.PORT || 8000;

// Essential for running behind GitHub's reverse proxy structure
app.set('trust proxy', 1);

// FIXED CORS: When withCredentials is true, origin CANNOT be '*'
// It must explicitly reflect the requesting origin back or handle it dynamically
app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl) or any origin in development
        callback(null, true);
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true // Crucial for matching the frontend axios configuration
}));

// Explicit fallback headers configuration
app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin) {
        res.header('Access-Control-Allow-Origin', origin); // Mirrors back the exact frontend origin
    }
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.header('Access-Control-Allow-Credentials', 'true'); // Must be explicit
    
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Synchronize verification context on file preservation system directories
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir);
}

app.use('/static/uploads', express.static(uploadDir, {
    setHeaders: (res) => {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    }
}));
app.use('/api/expenses', expenseRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/footprints', footprintRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/leaves', leaveRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/geofence', geofenceRoutes);


// Database Layer Connection Lifecycle Verification
// Keep force: false to preserve database tables
sequelize.sync({ force: false })
  .then(async () => {
    console.log('PostgreSQL architecture connected and mapped via Sequelize ORM smoothly.');
    
    // Schema migration: Clean up old Footprints table if it exists
    try {
      await sequelize.query('DROP TABLE IF EXISTS "Footprints";');
      console.log('Cleaned up legacy Footprints table.');
    } catch (migErr) {
      console.warn('PostgreSQL table cleanup warning:', migErr.message);
    }

    // Schema migration: Add address column to geotagged_media table if not exists
    try {
      await sequelize.query('ALTER TABLE geotagged_media ADD COLUMN IF NOT EXISTS address TEXT;');
      console.log('Migrated geotagged_media table schema: added address column.');
    } catch (migErr) {
      console.warn('PostgreSQL table migration warning:', migErr.message);
    }

    // Schema migration: Add battery_temp column to location_footprints table if not exists
    try {
      await sequelize.query('ALTER TABLE location_footprints ADD COLUMN IF NOT EXISTS battery_temp FLOAT;');
      console.log('Migrated location_footprints table schema: added battery_temp column.');
    } catch (migErr) {
      console.warn('PostgreSQL table migration warning:', migErr.message);
    }

    // Schema migration: Add address column to location_footprints table if not exists
    try {
      await sequelize.query('ALTER TABLE location_footprints ADD COLUMN IF NOT EXISTS address TEXT;');
      console.log('Migrated location_footprints table schema: added address column.');
    } catch (migErr) {
      console.warn('PostgreSQL table migration warning:', migErr.message);
    }

    // Schema migration: Add speed column to location_footprints table if not exists
    try {
      await sequelize.query('ALTER TABLE location_footprints ADD COLUMN IF NOT EXISTS speed FLOAT;');
      console.log('Migrated location_footprints table schema: added speed column.');
    } catch (migErr) {
      console.warn('PostgreSQL table migration warning:', migErr.message);
    }

    // Schema migration: Add heading column to location_footprints table if not exists
    try {
      await sequelize.query('ALTER TABLE location_footprints ADD COLUMN IF NOT EXISTS heading FLOAT;');
      console.log('Migrated location_footprints table schema: added heading column.');
    } catch (migErr) {
      console.warn('PostgreSQL table migration warning:', migErr.message);
    }

    // Schema migration: Add altitude column to location_footprints table if not exists
    try {
      await sequelize.query('ALTER TABLE location_footprints ADD COLUMN IF NOT EXISTS altitude FLOAT;');
      console.log('Migrated location_footprints table schema: added altitude column.');
    } catch (migErr) {
      console.warn('PostgreSQL table migration warning:', migErr.message);
    }

    // Schema migration: Add name column to location_geofence_settings table if not exists
    try {
      await sequelize.query('ALTER TABLE location_geofence_settings ADD COLUMN IF NOT EXISTS name VARCHAR(255) DEFAULT \'Office Geofence\';');
      console.log('Migrated location_geofence_settings table schema: added name column.');
    } catch (migErr) {
      console.warn('PostgreSQL table migration warning:', migErr.message);
    }

    // Schema migration: Add address column to Attendances table if not exists
    try {
      await sequelize.query('ALTER TABLE "Attendances" ADD COLUMN IF NOT EXISTS address TEXT;');
      console.log('Migrated Attendances table schema: added address column.');
    } catch (migErr) {
      console.warn('PostgreSQL table migration warning:', migErr.message);
    }

    // Seed initial employees
    try {
      const Employee = require('./models/Employee');
      const empCount = await Employee.count();
      if (empCount === 0) {
        await Employee.bulkCreate([
          { id: 'admin', name: 'Admin', email: 'admin@hrms.com', password: 'password123', role: 'ADMIN', designation: 'OFFICE', allowedLeaves: 15, consumedLeaves: 0 },
          { id: 'emp1', name: 'Aman', email: 'employee1@hrms.com', password: 'password123', role: 'EMPLOYEE', designation: 'OFFICE', allowedLeaves: 15, consumedLeaves: 0 },
          { id: 'emp2', name: 'Yash', email: 'employee2@hrms.com', password: 'password123', role: 'EMPLOYEE', designation: 'OFFICE', allowedLeaves: 15, consumedLeaves: 0 },
          { id: 'emp3', name: 'Rahul', email: 'employee3@hrms.com', password: 'password123', role: 'EMPLOYEE', designation: 'OFFICE', allowedLeaves: 15, consumedLeaves: 0 },
          { id: 'emp4', name: 'Pooja', email: 'employee4@hrms.com', password: 'password123', role: 'EMPLOYEE', designation: 'OFFICE', allowedLeaves: 15, consumedLeaves: 0 },
          { id: 'emp5', name: 'Sneha', email: 'employee5@hrms.com', password: 'password123', role: 'EMPLOYEE', designation: 'OFFICE', allowedLeaves: 15, consumedLeaves: 0 },
        ]);
        console.log('Seeded initial employees successfully.');
      }
    } catch (seedErr) {
      console.error('Failed to seed initial employees:', seedErr);
    }

    // Seed initial geofence settings
    try {
      const Geofence = require('./models/Geofence');
      const geoCount = await Geofence.count();
      if (geoCount === 0) {
        await Geofence.create({
          latitude: 28.6692,
          longitude: 77.4538,
          radius: 100.0
        });
        console.log('Seeded default geofence settings successfully.');
      }
    } catch (seedErr) {
      console.error('Failed to seed geofence settings:', seedErr);
    }

    // Switch to local standard host binding to bypass internal Codespaces proxy mismatches
    app.listen(PORT, () => {
      console.log(`Server executing active connection interface protocols across port: ${PORT}`);
    });
  })
  .catch(err => {
    console.error('Critical database initialization fault mapped:', err);
  });