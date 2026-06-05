const connectDB = require('../config/db');
const logger = require('../config/logger');
const User = require('../models/User');

const seed = async () => {
  try {
    await connectDB();
    logger.info('开始清理旧数据...');

    await User.deleteMany({});

    logger.info('创建测试用户...');
    const testUser = await User.create({
      username: '墨客',
      email: 'demo@henji.app',
      password: '123456',
      bio: '读书观剧，皆是人生痕迹。',
    });

    logger.info(`测试用户创建成功: ${testUser.username}`);
    logger.info(`登录邮箱: demo@henji.app / 密码: 123456`);
    logger.info('种子数据植入完成 ✅');

    process.exit(0);
  } catch (error) {
    logger.error('种子数据植入失败:', error);
    process.exit(1);
  }
};

if (require.main === module) {
  seed();
}

module.exports = seed;
