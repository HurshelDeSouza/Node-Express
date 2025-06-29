const { Pool } = require('pg');

// Create test database connection
const testPool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: 'parking_test_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
});

// Global test setup
beforeAll(async () => {
  // Create test database tables
  await testPool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      name VARCHAR(255) NOT NULL,
      phone VARCHAR(20),
      role VARCHAR(20) DEFAULT 'client' CHECK (role IN ('admin', 'employee', 'client')),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await testPool.query(`
    CREATE TABLE IF NOT EXISTS parking_spaces (
      id SERIAL PRIMARY KEY,
      space_number VARCHAR(10) UNIQUE NOT NULL,
      is_available BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await testPool.query(`
    CREATE TABLE IF NOT EXISTS reservations (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      parking_space_id INTEGER REFERENCES parking_spaces(id) ON DELETE CASCADE,
      vehicle_plate VARCHAR(20) NOT NULL,
      vehicle_model VARCHAR(100),
      start_time TIMESTAMP NOT NULL,
      end_time TIMESTAMP NOT NULL,
      status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'completed')),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await testPool.query(`
    CREATE TABLE IF NOT EXISTS logs (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      action VARCHAR(100) NOT NULL,
      details JSONB,
      ip_address INET,
      user_agent TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
});

// Global test teardown
afterAll(async () => {
  // Clean up test database
  await testPool.query('DROP TABLE IF EXISTS logs CASCADE');
  await testPool.query('DROP TABLE IF EXISTS reservations CASCADE');
  await testPool.query('DROP TABLE IF EXISTS parking_spaces CASCADE');
  await testPool.query('DROP TABLE IF EXISTS users CASCADE');
  
  await testPool.end();
});

// Clean database between tests
beforeEach(async () => {
  await testPool.query('DELETE FROM logs');
  await testPool.query('DELETE FROM reservations');
  await testPool.query('DELETE FROM parking_spaces');
  await testPool.query('DELETE FROM users');
});

module.exports = { testPool }; 