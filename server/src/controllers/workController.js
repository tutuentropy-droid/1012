const workService = require('../services/workService');
const { asyncHandler } = require('../utils');

const getWorks = asyncHandler(async (req, res) => {
  const result = await workService.getWorks(req.user._id, req.query);
  res.json(result);
});

const getWorkById = asyncHandler(async (req, res) => {
  const work = await workService.getWorkById(req.user._id, req.params.id);
  res.json(work);
});

const createWork = asyncHandler(async (req, res) => {
  const work = await workService.createWork(req.user._id, req.body);
  res.status(201).json(work);
});

const updateWork = asyncHandler(async (req, res) => {
  const work = await workService.updateWork(req.user._id, req.params.id, req.body);
  res.json(work);
});

const deleteWork = asyncHandler(async (req, res) => {
  const result = await workService.deleteWork(req.user._id, req.params.id);
  res.json(result);
});

const updateProgress = asyncHandler(async (req, res) => {
  const work = await workService.updateProgress(req.user._id, req.params.id, req.body);
  res.json(work);
});

const updateRating = asyncHandler(async (req, res) => {
  const { rating, moodColor } = req.body;
  const work = await workService.updateRating(req.user._id, req.params.id, rating, moodColor);
  res.json(work);
});

module.exports = {
  getWorks,
  getWorkById,
  createWork,
  updateWork,
  deleteWork,
  updateProgress,
  updateRating,
};
