const statsService = require('../services/statsService');
const { asyncHandler } = require('../utils');

const getOverview = asyncHandler(async (req, res) => {
  const stats = await statsService.getOverview(req.user._id);
  res.json(stats);
});

const getWeeklyHeatmap = asyncHandler(async (req, res) => {
  const weeks = parseInt(req.query.weeks, 10) || 52;
  const result = await statsService.getWeeklyHeatmap(req.user._id, weeks);
  res.json(result);
});

const getMonthlyStats = asyncHandler(async (req, res) => {
  const year = req.query.year ? parseInt(req.query.year, 10) : undefined;
  const result = await statsService.getMonthlyStats(req.user._id, year);
  res.json(result);
});

const getAnnualReport = asyncHandler(async (req, res) => {
  const year = parseInt(req.params.year, 10);
  const report = await statsService.getAnnualReport(req.user._id, year);
  res.json(report);
});

const getTasteGraph = asyncHandler(async (req, res) => {
  const graph = await statsService.getTasteGraph(req.user._id);
  res.json(graph);
});

module.exports = { getOverview, getWeeklyHeatmap, getMonthlyStats, getAnnualReport, getTasteGraph };
