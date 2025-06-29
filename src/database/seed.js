const bcrypt = require('bcryptjs');
const pool = require('../config/database');
const logger = require('../utils/logger');

const seedData = async () => {
  try {
    // Create admin user
    const adminPassword = await bcrypt.hash('admin123', 10);
    await pool.query(`
      INSERT INTO users (email, password, name, phone, role) 
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (email) DO NOTHING
    `, ['admin@parking.com', adminPassword, 'Admin User', '+1234567890', 'admin']);

    // Create employee user
    const employeePassword = await bcrypt.hash('employee123', 10);
    await pool.query(`
      INSERT INTO users (email, password, name, phone, role) 
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (email) DO NOTHING
    `, ['employee@parking.com', employeePassword, 'Employee User', '+1234567891', 'employee']);

    // Create client user
    const clientPassword = await bcrypt.hash('client123', 10);
    await pool.query(`
      INSERT INTO users (email, password, name, phone, role) 
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (email) DO NOTHING
    `, ['client@parking.com', clientPassword, 'Client User', '+1234567892', 'client']);

    // Create parking spaces
    for (let i = 1; i <= 20; i++) {
      await pool.query(`
        INSERT INTO parking_spaces (space_number) 
        VALUES ($1)
        ON CONFLICT (space_number) DO NOTHING
      `, [`A${i.toString().padStart(2, '0')}`]);
    }

    logger.info('Seed data created successfully');
  } catch (error) {
    logger.error('Error creating seed data:', error);
    throw error;
  }
};

const runSeed = async () => {
  try {
    await seedData();
    console.log('Seed completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  }
};

if (require.main === module) {
  runSeed();
}

module.exports = { seedData }; 