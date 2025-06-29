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

describe('User Management API (Case 3)', () => {
  let adminToken;
  let clientToken;
  let clientId;

  beforeEach(async () => {
    // Create test users
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    const adminResult = await testPool.query(`
      INSERT INTO users (email, password, name, phone, role)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, email, name, role
    `, ['admin@test.com', hashedPassword, 'Test Admin', '+1234567890', 'admin']);
    
    const clientResult = await testPool.query(`
      INSERT INTO users (email, password, name, phone, role)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, email, name, role
    `, ['client@test.com', hashedPassword, 'Test Client', '+1234567891', 'client']);
    
    adminToken = jwt.sign({ userId: adminResult.rows[0].id }, process.env.JWT_SECRET);
    clientToken = jwt.sign({ userId: clientResult.rows[0].id }, process.env.JWT_SECRET);
    clientId = clientResult.rows[0].id;
  });

  describe('GET /api/users', () => {
    it('should return all users for admin', async () => {
      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.message).toBe('Users retrieved successfully');
      expect(response.body.data).toHaveLength(2);
      expect(response.body.data[0]).toHaveProperty('id');
      expect(response.body.data[0]).toHaveProperty('email');
      expect(response.body.data[0]).toHaveProperty('name');
      expect(response.body.data[0]).toHaveProperty('role');
      expect(response.body.data[0]).not.toHaveProperty('password');
    });

    it('should deny access to non-admin users', async () => {
      await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${clientToken}`)
        .expect(403);
    });
  });

  describe('GET /api/users/:id', () => {
    it('should return user by ID for admin', async () => {
      const response = await request(app)
        .get(`/api/users/${clientId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.message).toBe('User retrieved successfully');
      expect(response.body.data.id).toBe(clientId);
      expect(response.body.data.email).toBe('client@test.com');
      expect(response.body.data).not.toHaveProperty('password');
    });

    it('should allow users to access their own profile', async () => {
      const response = await request(app)
        .get(`/api/users/${clientId}`)
        .set('Authorization', `Bearer ${clientToken}`)
        .expect(200);

      expect(response.body.data.id).toBe(clientId);
    });

    it('should deny users access to other profiles', async () => {
      const adminId = 1; // Assuming admin has ID 1
      
      await request(app)
        .get(`/api/users/${adminId}`)
        .set('Authorization', `Bearer ${clientToken}`)
        .expect(403);
    });

    it('should return 404 for non-existent user', async () => {
      await request(app)
        .get('/api/users/99999')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });

  describe('PUT /api/users/:id', () => {
    it('should update user profile successfully', async () => {
      const updateData = {
        name: 'Updated Name',
        phone: '+9876543210'
      };

      const response = await request(app)
        .put(`/api/users/${clientId}`)
        .set('Authorization', `Bearer ${clientToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.message).toBe('User updated successfully');
      expect(response.body.data.name).toBe('Updated Name');
      expect(response.body.data.phone).toBe('+9876543210');
    });

    it('should allow admin to update any user', async () => {
      const updateData = {
        name: 'Admin Updated Name',
        role: 'employee'
      };

      const response = await request(app)
        .put(`/api/users/${clientId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.data.name).toBe('Admin Updated Name');
      expect(response.body.data.role).toBe('employee');
    });

    it('should allow users to update their own email', async () => {
      const updateData = {
        email: 'newemail@test.com'
      };

      const response = await request(app)
        .put(`/api/users/${clientId}`)
        .set('Authorization', `Bearer ${clientToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.data.email).toBe('newemail@test.com');
    });

    it('should prevent duplicate email updates', async () => {
      // Create another user first
      const hashedPassword = await bcrypt.hash('password123', 10);
      await testPool.query(`
        INSERT INTO users (email, password, name, phone, role)
        VALUES ($1, $2, $3, $4, $5)
      `, ['another@test.com', hashedPassword, 'Another User', '+1234567892', 'client']);

      const updateData = {
        email: 'another@test.com'
      };

      await request(app)
        .put(`/api/users/${clientId}`)
        .set('Authorization', `Bearer ${clientToken}`)
        .send(updateData)
        .expect(409);
    });

    it('should allow password updates', async () => {
      const updateData = {
        password: 'newpassword123'
      };

      const response = await request(app)
        .put(`/api/users/${clientId}`)
        .set('Authorization', `Bearer ${clientToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.data).not.toHaveProperty('password');
    });

    it('should validate password length', async () => {
      const updateData = {
        password: '123'
      };

      await request(app)
        .put(`/api/users/${clientId}`)
        .set('Authorization', `Bearer ${clientToken}`)
        .send(updateData)
        .expect(400);
    });

    it('should prevent non-admin users from changing roles', async () => {
      const updateData = {
        role: 'admin'
      };

      await request(app)
        .put(`/api/users/${clientId}`)
        .set('Authorization', `Bearer ${clientToken}`)
        .send(updateData)
        .expect(403);
    });

    it('should validate role values', async () => {
      const updateData = {
        role: 'invalid_role'
      };

      await request(app)
        .put(`/api/users/${clientId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(400);
    });

    it('should return 404 for non-existent user', async () => {
      const updateData = {
        name: 'Test'
      };

      await request(app)
        .put('/api/users/99999')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(404);
    });
  });

  describe('DELETE /api/users/:id', () => {
    it('should allow admin to delete users', async () => {
      const response = await request(app)
        .delete(`/api/users/${clientId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.message).toBe('User deleted successfully');
      expect(response.body.data.id).toBe(clientId);
    });

    it('should deny non-admin users from deleting users', async () => {
      await request(app)
        .delete(`/api/users/${clientId}`)
        .set('Authorization', `Bearer ${clientToken}`)
        .expect(403);
    });

    it('should prevent admin from deleting themselves', async () => {
      const adminId = 1; // Assuming admin has ID 1
      
      await request(app)
        .delete(`/api/users/${adminId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);
    });

    it('should return 404 for non-existent user', async () => {
      await request(app)
        .delete('/api/users/99999')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });
}); 