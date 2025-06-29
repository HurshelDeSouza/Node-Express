const authService = require('../services/authService');
const logger = require('../utils/logger');

class AuthController {
  async register(req, res) {
    try {
      const { email, password, name, phone } = req.body;

      // Validation
      if (!email || !password || !name) {
        return res.status(400).json({
          message: 'Email, password and name are required'
        });
      }

      if (password.length < 6) {
        return res.status(400).json({
          message: 'Password must be at least 6 characters long'
        });
      }

      const result = await authService.register({
        email,
        password,
        name,
        phone
      });

      res.status(201).json({
        message: 'User registered successfully',
        data: result
      });
    } catch (error) {
      logger.error('Registration error:', error);
      
      if (error.message === 'User already exists') {
        return res.status(409).json({
          message: 'User already exists'
        });
      }

      res.status(500).json({
        message: 'Internal server error'
      });
    }
  }

  async login(req, res) {
    try {
      const { email, password } = req.body;

      // Validation
      if (!email || !password) {
        return res.status(400).json({
          message: 'Email and password are required'
        });
      }

      const result = await authService.login(email, password);

      res.status(200).json({
        message: 'Login successful',
        data: result
      });
    } catch (error) {
      logger.error('Login error:', error);
      
      if (error.message === 'Invalid credentials') {
        return res.status(401).json({
          message: 'Invalid credentials'
        });
      }

      res.status(500).json({
        message: 'Internal server error'
      });
    }
  }

  async refreshToken(req, res) {
    try {
      const { token } = req.body;

      if (!token) {
        return res.status(400).json({
          message: 'Token is required'
        });
      }

      const decoded = authService.verifyToken(token);
      const newToken = authService.generateToken(decoded.userId);

      res.status(200).json({
        message: 'Token refreshed successfully',
        data: { token: newToken }
      });
    } catch (error) {
      logger.error('Token refresh error:', error);
      
      res.status(401).json({
        message: 'Invalid token'
      });
    }
  }
}

module.exports = new AuthController(); 