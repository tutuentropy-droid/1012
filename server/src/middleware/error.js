const errorHandler = (err, req, res, next) => {
  const logger = require('../config/logger');
  logger.error(`${req.method} ${req.path} - ${err.message}`, {
    stack: err.stack,
    body: req.body,
    query: req.query,
  });

  if (err.name === 'ValidationError') {
    const details = {};
    Object.keys(err.errors).forEach((key) => {
      details[key] = err.errors[key].message;
    });
    return res.status(400).json({
      error: { code: 'VALIDATION_ERROR', message: err.message, details },
    });
  }

  if (err.name === 'CastError') {
    return res.status(400).json({
      error: { code: 'VALIDATION_ERROR', message: `无效的 ID: ${err.value}` },
    });
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: `${field} 已存在`,
        details: { [field]: '已存在' },
      },
    });
  }

  const statusCode = err.statusCode || 500;
  return res.status(statusCode).json({
    error: {
      code: err.code || 'INTERNAL_ERROR',
      message: err.message || '服务器内部错误',
    },
  });
};

const notFound = (req, res) => {
  res.status(404).json({
    error: { code: 'NOT_FOUND', message: `未找到 ${req.method} ${req.path}` },
  });
};

module.exports = { errorHandler, notFound };
