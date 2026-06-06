const User = require('../models/User');
const { signToken, AppError } = require('../utils');

class AuthService {
  async register(username, email, password) {
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      throw new AppError('邮箱已注册', 400, 'VALIDATION_ERROR');
    }
    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      throw new AppError('用户名已存在', 400, 'VALIDATION_ERROR');
    }
    const user = await User.create({ username, email, password });
    const token = signToken(user._id);
    return { token, user: user.toJSON() };
  }

  async login(email, password) {
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      throw new AppError('邮箱或密码错误', 401, 'UNAUTHORIZED');
    }
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw new AppError('邮箱或密码错误', 401, 'UNAUTHORIZED');
    }
    const token = signToken(user._id);
    return { token, user: user.toJSON() };
  }

  async getMe(userId) {
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('用户不存在', 404, 'NOT_FOUND');
    }
    return user.toJSON();
  }

  async updatePreferences(userId, preferences) {
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('用户不存在', 404, 'NOT_FOUND');
    }
    if (!user.preferences) {
      user.preferences = new Map();
    }
    Object.keys(preferences).forEach((key) => {
      user.preferences.set(key, preferences[key]);
    });
    user.markModified('preferences');
    await user.save();
    return user.toJSON();
  }
}

module.exports = new AuthService();
