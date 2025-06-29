const request = require('supertest');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { testPool } = require('./setup');

// Mock the server
let app;
let server;

beforeAll(async () => {
  // Start the server for testing
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test-secret';
  
  // Mock the database connection to use test database
  jest.mock('../src/config/database', () => ({
    query: (...args) => testPool.query(...args)
  }));
  
  app = require('../../src/server');
});

afterAll(async () => {
  if (server) {
    server.close();
  }
});

describe('Reservation API (Case 1)', () => {
  let clientToken;
  let parkingSpaceId;

  beforeEach(async () => {
    // Create a test user
    const hashedPassword = await bcrypt.hash('password123', 10);
    const userResult = await testPool.query(`
      INSERT INTO users (email, password, name, phone, role)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, email, name, role
    `, ['client@test.com', hashedPassword, 'Test Client', '+1234567890', 'client']);
    
    const user = userResult.rows[0];
    clientToken = jwt.sign({ userId: user.id }, process.env.JWT_SECRET);

    // Create a test parking space
    const spaceResult = await testPool.query(`
      INSERT INTO parking_spaces (space_number)
      VALUES ($1)
      RETURNING id
    `, ['A01']);
    
    parkingSpaceId = spaceResult.rows[0].id;
  });

  describe('POST /api/reservations', () => {
    it('should create a reservation successfully', async () => {
      const reservationData = {
        parking_space_id: parkingSpaceId,
        vehicle_plate: 'ABC123',
        vehicle_model: 'Toyota Camry',
        start_time: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
        end_time: new Date(Date.now() + 7200000).toISOString()   // 2 hours from now
      };

      const response = await request(app)
        .post('/api/reservations')
        .set('Authorization', `Bearer ${clientToken}`)
        .send(reservationData)
        .expect(201);

      expect(response.body.message).toBe('Reservation created successfully');
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.vehicle_plate).toBe('ABC123');
      expect(response.body.data.vehicle_model).toBe('Toyota Camry');
      expect(response.body.data.status).toBe('active');
    });

    it('should fail when parking space is not available', async () => {
      // Create a conflicting reservation first
      const conflictData = {
        parking_space_id: parkingSpaceId,
        vehicle_plate: 'XYZ789',
        vehicle_model: 'Honda Civic',
        start_time: new Date(Date.now() + 3600000).toISOString(),
        end_time: new Date(Date.now() + 7200000).toISOString()
      };

      await request(app)
        .post('/api/reservations')
        .set('Authorization', `Bearer ${clientToken}`)
        .send(conflictData);

      // Try to create another reservation for the same time
      const reservationData = {
        parking_space_id: parkingSpaceId,
        vehicle_plate: 'ABC123',
        vehicle_model: 'Toyota Camry',
        start_time: new Date(Date.now() + 3600000).toISOString(),
        end_time: new Date(Date.now() + 7200000).toISOString()
      };

      const response = await request(app)
        .post('/api/reservations')
        .set('Authorization', `Bearer ${clientToken}`)
        .send(reservationData)
        .expect(400);

      expect(response.body.message).toContain('already reserved');
    });

    it('should fail when parking space does not exist', async () => {
      const reservationData = {
        parking_space_id: 99999, // Non-existent space
        vehicle_plate: 'ABC123',
        vehicle_model: 'Toyota Camry',
        start_time: new Date(Date.now() + 3600000).toISOString(),
        end_time: new Date(Date.now() + 7200000).toISOString()
      };

      const response = await request(app)
        .post('/api/reservations')
        .set('Authorization', `Bearer ${clientToken}`)
        .send(reservationData)
        .expect(400);

      expect(response.body.message).toContain('not found');
    });

    it('should fail when start time is in the past', async () => {
      const reservationData = {
        parking_space_id: parkingSpaceId,
        vehicle_plate: 'ABC123',
        vehicle_model: 'Toyota Camry',
        start_time: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
        end_time: new Date(Date.now() + 3600000).toISOString()
      };

      const response = await request(app)
        .post('/api/reservations')
        .set('Authorization', `Bearer ${clientToken}`)
        .send(reservationData)
        .expect(400);

      expect(response.body.message).toBe('Start time must be in the future');
    });

    it('should fail when end time is before start time', async () => {
      const reservationData = {
        parking_space_id: parkingSpaceId,
        vehicle_plate: 'ABC123',
        vehicle_model: 'Toyota Camry',
        start_time: new Date(Date.now() + 7200000).toISOString(), // 2 hours from now
        end_time: new Date(Date.now() + 3600000).toISOString()   // 1 hour from now
      };

      const response = await request(app)
        .post('/api/reservations')
        .set('Authorization', `Bearer ${clientToken}`)
        .send(reservationData)
        .expect(400);

      expect(response.body.message).toBe('End time must be after start time');
    });

    it('should fail without authentication', async () => {
      const reservationData = {
        parking_space_id: parkingSpaceId,
        vehicle_plate: 'ABC123',
        vehicle_model: 'Toyota Camry',
        start_time: new Date(Date.now() + 3600000).toISOString(),
        end_time: new Date(Date.now() + 7200000).toISOString()
      };

      await request(app)
        .post('/api/reservations')
        .send(reservationData)
        .expect(401);
    });
  });

  describe('GET /api/reservations', () => {
    it('should return user reservations', async () => {
      // Create a reservation first
      const reservationData = {
        parking_space_id: parkingSpaceId,
        vehicle_plate: 'ABC123',
        vehicle_model: 'Toyota Camry',
        start_time: new Date(Date.now() + 3600000).toISOString(),
        end_time: new Date(Date.now() + 7200000).toISOString()
      };

      await request(app)
        .post('/api/reservations')
        .set('Authorization', `Bearer ${clientToken}`)
        .send(reservationData);

      const response = await request(app)
        .get('/api/reservations')
        .set('Authorization', `Bearer ${clientToken}`)
        .expect(200);

      expect(response.body.message).toBe('Reservations retrieved successfully');
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].vehicle_plate).toBe('ABC123');
    });
  });
}); 