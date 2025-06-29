const pool = require('../config/database');
const logger = require('../utils/logger');

const logActivity = async (req, res, next) => {
  const originalSend = res.send;
  
  res.send = function(data) {
    res.send = originalSend;
    
    // Log the activity
    const logData = {
      user_id: req.user ? req.user.id : null,
      action: `${req.method} ${req.originalUrl}`,
      details: {
        method: req.method,
        url: req.originalUrl,
        status_code: res.statusCode,
        user_agent: req.get('User-Agent'),
        ip_address: req.ip || req.connection.remoteAddress
      },
      ip_address: req.ip || req.connection.remoteAddress,
      user_agent: req.get('User-Agent')
    };

    // Don't log sensitive data
    if (req.body && req.body.password) {
      logData.details.body = { ...req.body, password: '[REDACTED]' };
    } else {
      logData.details.body = req.body;
    }

    // Insert into database
    pool.query(`
      INSERT INTO logs (user_id, action, details, ip_address, user_agent)
      VALUES ($1, $2, $3, $4, $5)
    `, [logData.user_id, logData.action, JSON.stringify(logData.details), logData.ip_address, logData.user_agent])
    .catch(err => {
      logger.error('Error logging activity:', err);
    });

    // Also log to winston
    logger.info('API Activity', logData);
    
    return originalSend.call(this, data);
  };
  
  next();
};

module.exports = { logActivity }; 