const logger = require('../utils/logger');

/**
 * Global error handler middleware
 */
function errorHandler(err, req, res, next) {
  logger.error('Unhandled error:', err);
  
  // Don't expose stack traces in production
  const error = process.env.NODE_ENV === 'production' 
    ? { message: 'Internal Server Error' }
    : { message: err.message, stack: err.stack };
  
  res.status(500).json({ error });
}

module.exports = errorHandler;
