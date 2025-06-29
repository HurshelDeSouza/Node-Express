const request = require('supertest');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { testPool } = require('./setup');

let app;

beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test-secret';
  
  jest.mock('../src/config/database', () => ({
    query: (...args) => testPool.query(...args)
  }));
  
  app = require('../../src/server');
});

describe('Parking Occupancy API (Case 2)', () => {
  let employeeToken;
  let clientToken;
  let parkingSpaceIds = [];

  beforeEach(async () => {
    // Create test users
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    const employeeResult = await testPool.query(`
      INSERT INTO users (email, password, name, phone, role)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, email, name, role
    `, ['employee@test.com', hashedPassword, 'Test Employee', '+1234567890', 'employee']);
    
    const clientResult = await testPool.query(`
      INSERT INTO users (email, password, name, phone, role)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, email, name, role
    `, ['client@test.com', hashedPassword, 'Test Client', '+1234567891', 'client']);
    
    employeeToken = jwt.sign({ userId: employeeResult.rows[0].id }, process.env.JWT_SECRET);
    clientToken = jwt.sign({ userId: clientResult.rows[0].id }, process.env.JWT_SECRET);

    // Create test parking spaces
    const spaces = ['A01', 'A02', 'A03', 'A04', 'A05'];
    for (const spaceNumber of spaces) {
      const spaceResult = await testPool.query(`
        INSERT INTO parking_spaces (space_number)
        VALUES ($1)
        RETURNING id
      `, [spaceNumber]);
      
      parkingSpaceIds.push(spaceResult.rows[0].id);
    }
  });

  describe('GET /api/parking/occupancy', () => {
    it('should return parking occupancy information', async () => {
      const response = await request(app)
        .get('/api/parking/occupancy')
        .set('Authorization', `Bearer ${employeeToken}`)
        .expect(200);

      expect(response.body.message).toBe('Parking occupancy retrieved successfully');
      expect(response.body.data).toHaveProperty('spaces');
      expect(response.body.data).toHaveProperty('statistics');
      expect(response.body.data.statistics).toHaveProperty('total_spaces');
      expect(response.body.data.statistics).toHaveProperty('occupied_spaces');
      expect(response.body.data.statistics).toHaveProperty('available_spaces');
      expect(response.body.data.statistics).toHaveProperty('occupancy_rate');
      
      expect(response.body.data.statistics.total_spaces).toBe(5);
      expect(response.body.data.statistics.occupied_spaces).toBe(0);
      expect(response.body.data.statistics.available_spaces).toBe(5);
      expect(response.body.data.statistics.occupancy_rate).toBe(0);
    });

    it('should show occupied spaces when reservations exist', async () => {
      // Create an active reservation
      const reservationData = {
        parking_space_id: parkingSpaceIds[0],
        vehicle_plate: 'ABC123',
        vehicle_model: 'Toyota Camry',
        start_time: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
        end_time: new Date(Date.now() + 3600000).toISOString()   // 1 hour from now
      };

      await testPool.query(`
        INSERT INTO reservations (user_id, parking_space_id, vehicle_plate, vehicle_model, start_time, end_time, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [1, parkingSpaceIds[0], 'ABC123', 'Toyota Camry', reservationData.start_time, reservationData.end_time, 'active']);

      const response = await request(app)
        .get('/api/parking/occupancy')
        .set('Authorization', `Bearer ${employeeToken}`)
        .expect(200);

      expect(response.body.data.statistics.occupied_spaces).toBe(1);
      expect(response.body.data.statistics.available_spaces).toBe(4);
      expect(response.body.data.statistics.occupancy_rate).toBe(20);

      // Check that the occupied space shows reservation details
      const occupiedSpace = response.body.data.spaces.find(space => space.is_occupied);
      expect(occupiedSpace).toBeDefined();
      expect(occupiedSpace.current_reservation).toHaveProperty('vehicle_plate', 'ABC123');
      expect(occupiedSpace.current_reservation).toHaveProperty('vehicle_model', 'Toyota Camry');
    });

    it('should not show cancelled reservations as occupied', async () => {
      // Create a cancelled reservation
      const reservationData = {
        parking_space_id: parkingSpaceIds[0],
        vehicle_plate: 'ABC123',
        vehicle_model: 'Toyota Camry',
        start_time: new Date(Date.now() - 3600000).toISOString(),
        end_time: new Date(Date.now() + 3600000).toISOString()
      };

      await testPool.query(`
        INSERT INTO reservations (user_id, parking_space_id, vehicle_plate, vehicle_model, start_time, end_time, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [1, parkingSpaceIds[0], 'ABC123', 'Toyota Camry', reservationData.start_time, reservationData.end_time, 'cancelled']);

      const response = await request(app)
        .get('/api/parking/occupancy')
        .set('Authorization', `Bearer ${employeeToken}`)
        .expect(200);

      expect(response.body.data.statistics.occupied_spaces).toBe(0);
      expect(response.body.data.statistics.available_spaces).toBe(5);
    });

    it('should not show expired reservations as occupied', async () => {
      // Create an expired reservation
      const reservationData = {
        parking_space_id: parkingSpaceIds[0],
        vehicle_plate: 'ABC123',
        vehicle_model: 'Toyota Camry',
        start_time: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
        end_time: new Date(Date.now() - 3600000).toISOString()   // 1 hour ago
      };

      await testPool.query(`
        INSERT INTO reservations (user_id, parking_space_id, vehicle_plate, vehicle_model, start_time, end_time, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [1, parkingSpaceIds[0], 'ABC123', 'Toyota Camry', reservationData.start_time, reservationData.end_time, 'active']);

      const response = await request(app)
        .get('/api/parking/occupancy')
        .set('Authorization', `Bearer ${employeeToken}`)
        .expect(200);

      expect(response.body.data.statistics.occupied_spaces).toBe(0);
      expect(response.body.data.statistics.available_spaces).toBe(5);
    });

    it('should work for clients as well', async () => {
      const response = await request(app)
        .get('/api/parking/occupancy')
        .set('Authorization', `Bearer ${clientToken}`)
        .expect(200);

      expect(response.body.message).toBe('Parking occupancy retrieved successfully');
      expect(response.body.data.statistics.total_spaces).toBe(5);
    });

    it('should fail without authentication', async () => {
      await request(app)
        .get('/api/parking/occupancy')
        .expect(401);
    });
  });

  describe('GET /api/parking/spaces', () => {
    it('should return all parking spaces', async () => {
      const response = await request(app)
        .get('/api/parking/spaces')
        .set('Authorization', `Bearer ${employeeToken}`)
        .expect(200);

      expect(response.body.message).toBe('Parking spaces retrieved successfully');
      expect(response.body.data).toHaveLength(5);
      expect(response.body.data[0]).toHaveProperty('id');
      expect(response.body.data[0]).toHaveProperty('space_number');
      expect(response.body.data[0]).toHaveProperty('is_available');
    });
  });
}); 