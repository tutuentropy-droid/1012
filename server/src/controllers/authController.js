const authService = require('../services/authService');
const { asyncHandler } = require('../utils');

const register = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body;
  const result = await authService.register(username, email, password);
  res.status(201).json(result);
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const result = await authService.login(email, password);
  res.json(result);
});

const getMe = asyncHandler(async (req, res) => {
  const user = await authService.getMe(req.user._id);
  res.json(user);
});

module.exports = { register, login, getMe };
