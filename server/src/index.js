const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const config = require('./config');
const logger = require('./config/logger');
const connectDB = require('./config/db');
const { errorHandler, notFound } = require('./middleware/error');
const routes = require('./routes');

const app = express();

connectDB();

app.set('trust proxy', 1);

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        fontSrc: ["'self'", 'data:'],
      },
    },
  })
);

app.use(
  cors({
    origin: config.clientOrigin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

app.use(
  morgan(config.nodeEnv === 'production' ? 'combined' : 'dev', {
    stream: { write: (message) => logger.http(message.trim()) },
  })
);

const apiLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  message: {
    error: {
      code: 'RATE_LIMITED',
      message: '请求过于频繁，请稍后再试',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'henji-server',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

app.use('/api/v1', apiLimiter, routes);

app.use(notFound);
app.use(errorHandler);

const server = app.listen(config.port, () => {
  logger.info(`
╔═══════════════════════════════════════════╗
║        痕迹 · Henji Server 已启动         ║
╠═══════════════════════════════════════════╣
║  环境: ${config.nodeEnv.padEnd(33)}║
║  端口: ${String(config.port).padEnd(33)}║
║  地址: http://localhost:${String(config.port).padEnd(18)}║
╚═══════════════════════════════════════════╝
  `);
});

const shutdown = (signal) => {
  logger.info(`${signal} 信号收到，正在优雅关闭...`);
  server.close(() => {
    logger.info('HTTP 服务器已关闭');
    process.exit(0);
  });
  setTimeout(() => {
    logger.error('强制关闭超时，直接退出');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('uncaughtException', (err) => {
  logger.error('未捕获的异常:', err);
  process.exit(1);
});
process.on('unhandledRejection', (reason) => {
  logger.error('未处理的 Promise 拒绝:', reason);
  process.exit(1);
});

module.exports = app;
