const pool = require('../config/database');
const bcrypt = require('bcryptjs');
const logger = require('../utils/logger');

class UserController {
  async getUsers(req, res) {
    try {
      const result = await pool.query(`
        SELECT id, email, name, phone, role, created_at, updated_at
        FROM users
        ORDER BY created_at DESC
      `);

      res.status(200).json({
        message: 'Users retrieved successfully',
        data: result.rows
      });
    } catch (error) {
      logger.error('Error fetching users:', error);
      res.status(500).json({
        message: 'Internal server error'
      });
    }
  }

  async getUserById(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const userRole = req.user.role;

      // Users can only access their own profile unless they're admin/employee
      if (userRole === 'client' && parseInt(id) !== userId) {
        return res.status(403).json({
          message: 'Access denied'
        });
      }

      const result = await pool.query(`
        SELECT id, email, name, phone, role, created_at, updated_at
        FROM users
        WHERE id = $1
      `, [id]);

      if (result.rows.length === 0) {
        return res.status(404).json({
          message: 'User not found'
        });
      }

      res.status(200).json({
        message: 'User retrieved successfully',
        data: result.rows[0]
      });
    } catch (error) {
      logger.error('Error fetching user:', error);
      res.status(500).json({
        message: 'Internal server error'
      });
    }
  }

  async updateUser(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const userId = req.user.id;
      const userRole = req.user.role;

      // Users can only update their own profile unless they're admin
      if (userRole === 'client' && parseInt(id) !== userId) {
        return res.status(403).json({
          message: 'Access denied'
        });
      }

      // Only admins can change roles
      if (updateData.role && userRole !== 'admin') {
        return res.status(403).json({
          message: 'Only administrators can change user roles'
        });
      }

      // Check if user exists
      const existingUser = await pool.query('SELECT id FROM users WHERE id = $1', [id]);
      if (existingUser.rows.length === 0) {
        return res.status(404).json({
          message: 'User not found'
        });
      }

      // Build update query
      const updateFields = [];
      const params = [];
      let paramIndex = 1;

      if (updateData.name) {
        updateFields.push(`name = $${paramIndex++}`);
        params.push(updateData.name);
      }

      if (updateData.phone) {
        updateFields.push(`phone = $${paramIndex++}`);
        params.push(updateData.phone);
      }

      if (updateData.email) {
        // Check if email is already taken
        const emailCheck = await pool.query(
          'SELECT id FROM users WHERE email = $1 AND id != $2',
          [updateData.email, id]
        );
        if (emailCheck.rows.length > 0) {
          return res.status(409).json({
            message: 'Email already in use'
          });
        }
        updateFields.push(`email = $${paramIndex++}`);
        params.push(updateData.email);
      }

      if (updateData.password) {
        if (updateData.password.length < 6) {
          return res.status(400).json({
            message: 'Password must be at least 6 characters long'
          });
        }
        const hashedPassword = await bcrypt.hash(updateData.password, 10);
        updateFields.push(`password = $${paramIndex++}`);
        params.push(hashedPassword);
      }

      if (updateData.role && userRole === 'admin') {
        if (!['admin', 'employee', 'client'].includes(updateData.role)) {
          return res.status(400).json({
            message: 'Invalid role'
          });
        }
        updateFields.push(`role = $${paramIndex++}`);
        params.push(updateData.role);
      }

      if (updateFields.length === 0) {
        return res.status(400).json({
          message: 'No fields to update'
        });
      }

      updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
      params.push(id);

      const result = await pool.query(`
        UPDATE users 
        SET ${updateFields.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING id, email, name, phone, role, created_at, updated_at
      `, params);

      logger.info('User updated successfully', { userId: id, updatedBy: userId });

      res.status(200).json({
        message: 'User updated successfully',
        data: result.rows[0]
      });
    } catch (error) {
      logger.error('Error updating user:', error);
      res.status(500).json({
        message: 'Internal server error'
      });
    }
  }

  async deleteUser(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const userRole = req.user.role;

      // Only admins can delete users
      if (userRole !== 'admin') {
        return res.status(403).json({
          message: 'Access denied'
        });
      }

      // Prevent self-deletion
      if (parseInt(id) === userId) {
        return res.status(400).json({
          message: 'Cannot delete your own account'
        });
      }

      // Check if user has active reservations
      const activeReservations = await pool.query(`
        SELECT id FROM reservations 
        WHERE user_id = $1 AND status = 'active'
      `, [id]);

      if (activeReservations.rows.length > 0) {
        return res.status(400).json({
          message: 'Cannot delete user with active reservations'
        });
      }

      const result = await pool.query(`
        DELETE FROM users 
        WHERE id = $1
        RETURNING id, email, name
      `, [id]);

      if (result.rows.length === 0) {
        return res.status(404).json({
          message: 'User not found'
        });
      }

      logger.info('User deleted successfully', { deletedUserId: id, deletedBy: userId });

      res.status(200).json({
        message: 'User deleted successfully',
        data: result.rows[0]
      });
    } catch (error) {
      logger.error('Error deleting user:', error);
      res.status(500).json({
        message: 'Internal server error'
      });
    }
  }
}

module.exports = new UserController(); 