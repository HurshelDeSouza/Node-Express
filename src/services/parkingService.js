const pool = require('../config/database');
const logger = require('../utils/logger');

class ParkingService {
  async getParkingSpaces() {
    try {
      const result = await pool.query(`
        SELECT id, space_number, is_available, created_at
        FROM parking_spaces
        ORDER BY space_number
      `);
      return result.rows;
    } catch (error) {
      logger.error('Error fetching parking spaces:', error);
      throw error;
    }
  }

  async getOccupancy() {
    try {
      // Get current occupancy status
      const result = await pool.query(`
        SELECT 
          ps.id,
          ps.space_number,
          ps.is_available,
          r.id as reservation_id,
          r.vehicle_plate,
          r.vehicle_model,
          r.start_time,
          r.end_time,
          r.status,
          u.name as user_name,
          u.email as user_email
        FROM parking_spaces ps
        LEFT JOIN reservations r ON ps.id = r.parking_space_id 
          AND r.status = 'active' 
          AND NOW() BETWEEN r.start_time AND r.end_time
        LEFT JOIN users u ON r.user_id = u.id
        ORDER BY ps.space_number
      `);

      const occupancy = result.rows.map(row => ({
        space_id: row.id,
        space_number: row.space_number,
        is_occupied: !!row.reservation_id,
        current_reservation: row.reservation_id ? {
          id: row.reservation_id,
          vehicle_plate: row.vehicle_plate,
          vehicle_model: row.vehicle_model,
          start_time: row.start_time,
          end_time: row.end_time,
          user_name: row.user_name,
          user_email: row.user_email
        } : null
      }));

      // Calculate statistics
      const totalSpaces = occupancy.length;
      const occupiedSpaces = occupancy.filter(space => space.is_occupied).length;
      const availableSpaces = totalSpaces - occupiedSpaces;
      const occupancyRate = totalSpaces > 0 ? (occupiedSpaces / totalSpaces * 100).toFixed(2) : 0;

      logger.info('Parking occupancy retrieved', { 
        totalSpaces, 
        occupiedSpaces, 
        availableSpaces, 
        occupancyRate 
      });

      return {
        spaces: occupancy,
        statistics: {
          total_spaces: totalSpaces,
          occupied_spaces: occupiedSpaces,
          available_spaces: availableSpaces,
          occupancy_rate: parseFloat(occupancyRate)
        }
      };
    } catch (error) {
      logger.error('Error fetching parking occupancy:', error);
      throw error;
    }
  }

  async createParkingSpace(spaceData) {
    try {
      const { space_number } = spaceData;

      // Check if space number already exists
      const existingSpace = await pool.query(
        'SELECT id FROM parking_spaces WHERE space_number = $1',
        [space_number]
      );

      if (existingSpace.rows.length > 0) {
        throw new Error('Parking space number already exists');
      }

      const result = await pool.query(`
        INSERT INTO parking_spaces (space_number)
        VALUES ($1)
        RETURNING *
      `, [space_number]);

      const newSpace = result.rows[0];

      logger.info('Parking space created successfully', { 
        spaceId: newSpace.id, 
        spaceNumber: space_number 
      });

      return newSpace;
    } catch (error) {
      logger.error('Error creating parking space:', error);
      throw error;
    }
  }

  async updateParkingSpace(spaceId, updateData) {
    try {
      const { space_number, is_available } = updateData;

      const updateFields = [];
      const params = [];
      let paramIndex = 1;

      if (space_number !== undefined) {
        updateFields.push(`space_number = $${paramIndex++}`);
        params.push(space_number);
      }

      if (is_available !== undefined) {
        updateFields.push(`is_available = $${paramIndex++}`);
        params.push(is_available);
      }

      if (updateFields.length === 0) {
        throw new Error('No fields to update');
      }

      updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
      params.push(spaceId);

      const result = await pool.query(`
        UPDATE parking_spaces 
        SET ${updateFields.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING *
      `, params);

      if (result.rows.length === 0) {
        throw new Error('Parking space not found');
      }

      logger.info('Parking space updated successfully', { 
        spaceId, 
        updateData 
      });

      return result.rows[0];
    } catch (error) {
      logger.error('Error updating parking space:', error);
      throw error;
    }
  }

  async deleteParkingSpace(spaceId) {
    try {
      // Check if space has active reservations
      const activeReservations = await pool.query(`
        SELECT id FROM reservations 
        WHERE parking_space_id = $1 AND status = 'active'
      `, [spaceId]);

      if (activeReservations.rows.length > 0) {
        throw new Error('Cannot delete parking space with active reservations');
      }

      const result = await pool.query(`
        DELETE FROM parking_spaces 
        WHERE id = $1
        RETURNING *
      `, [spaceId]);

      if (result.rows.length === 0) {
        throw new Error('Parking space not found');
      }

      logger.info('Parking space deleted successfully', { spaceId });

      return result.rows[0];
    } catch (error) {
      logger.error('Error deleting parking space:', error);
      throw error;
    }
  }
}

module.exports = new ParkingService(); 