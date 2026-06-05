const mongoose = require('mongoose');
const config = require('../config');
const logger = require('./logger');

async function connectDB() {
  try {
    const conn = await mongoose.connect(config.mongoUri);
    logger.info(`MongoDB 已连接: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    logger.error('MongoDB 连接失败:', error.message);
    process.exit(1);
  }
}

mongoose.connection.on('error', (err) => {
  logger.error('MongoDB 连接错误:', err.message);
});

mongoose.connection.on('disconnected', () => {
  logger.warn('MongoDB 连接断开');
});

module.exports = connectDB;
