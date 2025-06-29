const pool = require('../config/database');
const logger = require('../utils/logger');

class LogController {
  async getLogs(req, res) {
    try {
      const { page = 1, limit = 50, action, user_id, start_date, end_date } = req.query;
      const offset = (page - 1) * limit;

      // Build query with filters
      let query = `
        SELECT l.*, u.name as user_name, u.email as user_email
        FROM logs l
        LEFT JOIN users u ON l.user_id = u.id
        WHERE 1=1
      `;
      const params = [];
      let paramIndex = 1;

      if (action) {
        query += ` AND l.action ILIKE $${paramIndex++}`;
        params.push(`%${action}%`);
      }

      if (user_id) {
        query += ` AND l.user_id = $${paramIndex++}`;
        params.push(user_id);
      }

      if (start_date) {
        query += ` AND l.created_at >= $${paramIndex++}`;
        params.push(start_date);
      }

      if (end_date) {
        query += ` AND l.created_at <= $${paramIndex++}`;
        params.push(end_date);
      }

      // Get total count
      const countQuery = query.replace('l.*, u.name as user_name, u.email as user_email', 'COUNT(*)');
      const countResult = await pool.query(countQuery, params);
      const totalLogs = parseInt(countResult.rows[0].count);

      // Get paginated results
      query += ` ORDER BY l.created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
      params.push(limit, offset);

      const result = await pool.query(query, params);

      const totalPages = Math.ceil(totalLogs / limit);

      res.status(200).json({
        message: 'Logs retrieved successfully',
        data: {
          logs: result.rows,
          pagination: {
            current_page: parseInt(page),
            total_pages: totalPages,
            total_logs: totalLogs,
            logs_per_page: parseInt(limit)
          }
        }
      });
    } catch (error) {
      logger.error('Error fetching logs:', error);
      res.status(500).json({
        message: 'Internal server error'
      });
    }
  }

  async getLogById(req, res) {
    try {
      const { id } = req.params;

      const result = await pool.query(`
        SELECT l.*, u.name as user_name, u.email as user_email
        FROM logs l
        LEFT JOIN users u ON l.user_id = u.id
        WHERE l.id = $1
      `, [id]);

      if (result.rows.length === 0) {
        return res.status(404).json({
          message: 'Log not found'
        });
      }

      res.status(200).json({
        message: 'Log retrieved successfully',
        data: result.rows[0]
      });
    } catch (error) {
      logger.error('Error fetching log:', error);
      res.status(500).json({
        message: 'Internal server error'
      });
    }
  }

  async getLogStats(req, res) {
    try {
      const { start_date, end_date } = req.query;

      let dateFilter = '';
      const params = [];

      if (start_date && end_date) {
        dateFilter = 'WHERE created_at BETWEEN $1 AND $2';
        params.push(start_date, end_date);
      } else if (start_date) {
        dateFilter = 'WHERE created_at >= $1';
        params.push(start_date);
      } else if (end_date) {
        dateFilter = 'WHERE created_at <= $1';
        params.push(end_date);
      }

      // Get action statistics
      const actionStats = await pool.query(`
        SELECT action, COUNT(*) as count
        FROM logs
        ${dateFilter}
        GROUP BY action
        ORDER BY count DESC
      `, params);

      // Get user activity statistics
      const userStats = await pool.query(`
        SELECT u.name, u.email, COUNT(l.id) as activity_count
        FROM logs l
        LEFT JOIN users u ON l.user_id = u.id
        ${dateFilter}
        GROUP BY u.id, u.name, u.email
        ORDER BY activity_count DESC
        LIMIT 10
      `, params);

      // Get daily activity
      const dailyStats = await pool.query(`
        SELECT DATE(created_at) as date, COUNT(*) as count
        FROM logs
        ${dateFilter}
        GROUP BY DATE(created_at)
        ORDER BY date DESC
        LIMIT 30
      `, params);

      res.status(200).json({
        message: 'Log statistics retrieved successfully',
        data: {
          action_statistics: actionStats.rows,
          user_activity: userStats.rows,
          daily_activity: dailyStats.rows
        }
      });
    } catch (error) {
      logger.error('Error fetching log statistics:', error);
      res.status(500).json({
        message: 'Internal server error'
      });
    }
  }
}

module.exports = new LogController(); 