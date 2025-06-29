const parkingService = require('../services/parkingService');
const logger = require('../utils/logger');

class ParkingController {
  async getParkingSpaces(req, res) {
    try {
      const spaces = await parkingService.getParkingSpaces();

      res.status(200).json({
        message: 'Parking spaces retrieved successfully',
        data: spaces
      });
    } catch (error) {
      logger.error('Error fetching parking spaces:', error);
      res.status(500).json({
        message: 'Internal server error'
      });
    }
  }

  async getOccupancy(req, res) {
    try {
      const occupancy = await parkingService.getOccupancy();

      res.status(200).json({
        message: 'Parking occupancy retrieved successfully',
        data: occupancy
      });
    } catch (error) {
      logger.error('Error fetching parking occupancy:', error);
      res.status(500).json({
        message: 'Internal server error'
      });
    }
  }

  async createParkingSpace(req, res) {
    try {
      const { space_number } = req.body;

      // Validation
      if (!space_number) {
        return res.status(400).json({
          message: 'space_number is required'
        });
      }

      if (typeof space_number !== 'string' || space_number.trim().length === 0) {
        return res.status(400).json({
          message: 'space_number must be a non-empty string'
        });
      }

      const space = await parkingService.createParkingSpace({ space_number });

      res.status(201).json({
        message: 'Parking space created successfully',
        data: space
      });
    } catch (error) {
      logger.error('Error creating parking space:', error);
      
      if (error.message === 'Parking space number already exists') {
        return res.status(409).json({
          message: error.message
        });
      }

      res.status(500).json({
        message: 'Internal server error'
      });
    }
  }

  async updateParkingSpace(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      // Validation
      if (updateData.space_number && (typeof updateData.space_number !== 'string' || updateData.space_number.trim().length === 0)) {
        return res.status(400).json({
          message: 'space_number must be a non-empty string'
        });
      }

      if (updateData.is_available !== undefined && typeof updateData.is_available !== 'boolean') {
        return res.status(400).json({
          message: 'is_available must be a boolean'
        });
      }

      const space = await parkingService.updateParkingSpace(id, updateData);

      res.status(200).json({
        message: 'Parking space updated successfully',
        data: space
      });
    } catch (error) {
      logger.error('Error updating parking space:', error);
      
      if (error.message === 'Parking space not found') {
        return res.status(404).json({
          message: 'Parking space not found'
        });
      }

      res.status(500).json({
        message: 'Internal server error'
      });
    }
  }

  async deleteParkingSpace(req, res) {
    try {
      const { id } = req.params;

      const space = await parkingService.deleteParkingSpace(id);

      res.status(200).json({
        message: 'Parking space deleted successfully',
        data: space
      });
    } catch (error) {
      logger.error('Error deleting parking space:', error);
      
      if (error.message === 'Parking space not found') {
        return res.status(404).json({
          message: 'Parking space not found'
        });
      }

      if (error.message === 'Cannot delete parking space with active reservations') {
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

module.exports = new ParkingController(); 