const searchService = require('../services/searchService');
const { CHINESE_COLORS } = require('../data/constants');
const { asyncHandler } = require('../utils');

const globalSearch = asyncHandler(async (req, res) => {
  const { q, scope } = req.query;
  if (!q) {
    return res.json({ works: [], notes: [], tags: [] });
  }
  const result = await searchService.globalSearch(req.user._id, q, scope);
  res.json(result);
});

const getChineseColors = asyncHandler(async (req, res) => {
  res.json(CHINESE_COLORS);
});

module.exports = { globalSearch, getChineseColors };
