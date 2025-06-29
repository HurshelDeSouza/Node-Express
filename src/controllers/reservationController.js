const reservationService = require('../services/reservationService');
const logger = require('../utils/logger');

class ReservationController {
  async createReservation(req, res) {
    try {
      const { parking_space_id, vehicle_plate, vehicle_model, start_time, end_time } = req.body;
      const userId = req.user.id;

      // Validation
      if (!parking_space_id || !vehicle_plate || !start_time || !end_time) {
        return res.status(400).json({
          message: 'parking_space_id, vehicle_plate, start_time, and end_time are required'
        });
      }

      // Validate dates
      const startDate = new Date(start_time);
      const endDate = new Date(end_time);
      const now = new Date();

      if (startDate <= now) {
        return res.status(400).json({
          message: 'Start time must be in the future'
        });
      }

      if (endDate <= startDate) {
        return res.status(400).json({
          message: 'End time must be after start time'
        });
      }

      const reservation = await reservationService.createReservation({
        parking_space_id,
        vehicle_plate,
        vehicle_model,
        start_time: startDate,
        end_time: endDate
      }, userId);

      res.status(201).json({
        message: 'Reservation created successfully',
        data: reservation
      });
    } catch (error) {
      logger.error('Reservation creation error:', error);
      
      if (error.message.includes('not found') || error.message.includes('not available') || error.message.includes('already reserved')) {
        return res.status(400).json({
          message: error.message
        });
      }

      res.status(500).json({
        message: 'Internal server error'
      });
    }
  }

  async getReservations(req, res) {
    try {
      const userId = req.user.id;
      const userRole = req.user.role;

      const reservations = await reservationService.getReservations(userId, userRole);

      res.status(200).json({
        message: 'Reservations retrieved successfully',
        data: reservations
      });
    } catch (error) {
      logger.error('Error fetching reservations:', error);
      res.status(500).json({
        message: 'Internal server error'
      });
    }
  }

  async getReservationById(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const userRole = req.user.role;

      const reservation = await reservationService.getReservationById(id, userId, userRole);

      res.status(200).json({
        message: 'Reservation retrieved successfully',
        data: reservation
      });
    } catch (error) {
      logger.error('Error fetching reservation:', error);
      
      if (error.message === 'Reservation not found') {
        return res.status(404).json({
          message: 'Reservation not found'
        });
      }

      res.status(500).json({
        message: 'Internal server error'
      });
    }
  }

  async updateReservation(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const userId = req.user.id;
      const userRole = req.user.role;

      // Validate dates if provided
      if (updateData.start_time) {
        const startDate = new Date(updateData.start_time);
        const now = new Date();
        if (startDate <= now) {
          return res.status(400).json({
            message: 'Start time must be in the future'
          });
        }
        updateData.start_time = startDate;
      }

      if (updateData.end_time) {
        const endDate = new Date(updateData.end_time);
        updateData.end_time = endDate;
      }

      if (updateData.start_time && updateData.end_time) {
        if (updateData.end_time <= updateData.start_time) {
          return res.status(400).json({
            message: 'End time must be after start time'
          });
        }
      }

      const reservation = await reservationService.updateReservation(id, updateData, userId, userRole);

      res.status(200).json({
        message: 'Reservation updated successfully',
        data: reservation
      });
    } catch (error) {
      logger.error('Reservation update error:', error);
      
      if (error.message === 'Reservation not found') {
        return res.status(404).json({
          message: 'Reservation not found'
        });
      }

      if (error.message === 'Cannot update non-active reservation') {
        return res.status(400).json({
          message: error.message
        });
      }

      res.status(500).json({
        message: 'Internal server error'
      });
    }
  }

  async cancelReservation(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const userRole = req.user.role;

      const reservation = await reservationService.cancelReservation(id, userId, userRole);

      res.status(200).json({
        message: 'Reservation cancelled successfully',
        data: reservation
      });
    } catch (error) {
      logger.error('Reservation cancellation error:', error);
      
      if (error.message === 'Reservation not found') {
        return res.status(404).json({
          message: 'Reservation not found'
        });
      }

      if (error.message === 'Reservation is not active') {
        return res.status(400).json({
          message: error.message
        });
      }

      res.status(500).json({
        message: 'Internal server error'
      });
    }
  }
}

module.exports = new ReservationController(); 