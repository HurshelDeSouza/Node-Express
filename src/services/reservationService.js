const pool = require('../config/database');
const logger = require('../utils/logger');

class ReservationService {
  async createReservation(reservationData, userId) {
    try {
      const { parking_space_id, vehicle_plate, vehicle_model, start_time, end_time } = reservationData;

      // Check if parking space exists and is available
      const spaceResult = await pool.query(
        'SELECT id, is_available FROM parking_spaces WHERE id = $1',
        [parking_space_id]
      );

      if (spaceResult.rows.length === 0) {
        throw new Error('Parking space not found');
      }

      if (!spaceResult.rows[0].is_available) {
        throw new Error('Parking space is not available');
      }

      // Check for time conflicts
      const conflictResult = await pool.query(`
        SELECT id FROM reservations 
        WHERE parking_space_id = $1 
        AND status = 'active'
        AND (
          (start_time <= $2 AND end_time > $2) OR
          (start_time < $3 AND end_time >= $3) OR
          (start_time >= $2 AND end_time <= $3)
        )
      `, [parking_space_id, start_time, end_time]);

      if (conflictResult.rows.length > 0) {
        throw new Error('Parking space is already reserved for this time period');
      }

      // Create reservation
      const result = await pool.query(`
        INSERT INTO reservations (user_id, parking_space_id, vehicle_plate, vehicle_model, start_time, end_time)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `, [userId, parking_space_id, vehicle_plate, vehicle_model, start_time, end_time]);

      const reservation = result.rows[0];

      logger.info('Reservation created successfully', { 
        reservationId: reservation.id, 
        userId, 
        parkingSpaceId: parking_space_id 
      });

      return reservation;
    } catch (error) {
      logger.error('Reservation creation failed:', error);
      throw error;
    }
  }

  async getReservations(userId, userRole) {
    try {
      let query = `
        SELECT r.*, ps.space_number, u.name as user_name, u.email
        FROM reservations r
        JOIN parking_spaces ps ON r.parking_space_id = ps.id
        JOIN users u ON r.user_id = u.id
      `;

      const params = [];

      // Filter by user role
      if (userRole === 'client') {
        query += ' WHERE r.user_id = $1';
        params.push(userId);
      }

      query += ' ORDER BY r.created_at DESC';

      const result = await pool.query(query, params);
      return result.rows;
    } catch (error) {
      logger.error('Error fetching reservations:', error);
      throw error;
    }
  }

  async getReservationById(reservationId, userId, userRole) {
    try {
      let query = `
        SELECT r.*, ps.space_number, u.name as user_name, u.email
        FROM reservations r
        JOIN parking_spaces ps ON r.parking_space_id = ps.id
        JOIN users u ON r.user_id = u.id
        WHERE r.id = $1
      `;

      const params = [reservationId];

      // Add user filter for clients
      if (userRole === 'client') {
        query += ' AND r.user_id = $2';
        params.push(userId);
      }

      const result = await pool.query(query, params);

      if (result.rows.length === 0) {
        throw new Error('Reservation not found');
      }

      return result.rows[0];
    } catch (error) {
      logger.error('Error fetching reservation:', error);
      throw error;
    }
  }

  async updateReservation(reservationId, updateData, userId, userRole) {
    try {
      // Check if reservation exists and user has permission
      const reservation = await this.getReservationById(reservationId, userId, userRole);

      // Only allow updates if reservation is active
      if (reservation.status !== 'active') {
        throw new Error('Cannot update non-active reservation');
      }

      // Build update query
      const updateFields = [];
      const params = [];
      let paramIndex = 1;

      if (updateData.vehicle_plate) {
        updateFields.push(`vehicle_plate = $${paramIndex++}`);
        params.push(updateData.vehicle_plate);
      }

      if (updateData.vehicle_model) {
        updateFields.push(`vehicle_model = $${paramIndex++}`);
        params.push(updateData.vehicle_model);
      }

      if (updateData.start_time) {
        updateFields.push(`start_time = $${paramIndex++}`);
        params.push(updateData.start_time);
      }

      if (updateData.end_time) {
        updateFields.push(`end_time = $${paramIndex++}`);
        params.push(updateData.end_time);
      }

      if (updateFields.length === 0) {
        throw new Error('No fields to update');
      }

      updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
      params.push(reservationId);

      const result = await pool.query(`
        UPDATE reservations 
        SET ${updateFields.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING *
      `, params);

      logger.info('Reservation updated successfully', { 
        reservationId, 
        userId 
      });

      return result.rows[0];
    } catch (error) {
      logger.error('Reservation update failed:', error);
      throw error;
    }
  }

  async cancelReservation(reservationId, userId, userRole) {
    try {
      // Check if reservation exists and user has permission
      const reservation = await this.getReservationById(reservationId, userId, userRole);

      if (reservation.status !== 'active') {
        throw new Error('Reservation is not active');
      }

      const result = await pool.query(`
        UPDATE reservations 
        SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING *
      `, [reservationId]);

      logger.info('Reservation cancelled successfully', { 
        reservationId, 
        userId 
      });

      return result.rows[0];
    } catch (error) {
      logger.error('Reservation cancellation failed:', error);
      throw error;
    }
  }
}

module.exports = new ReservationService(); 