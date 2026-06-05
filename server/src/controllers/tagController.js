const tagService = require('../services/tagService');
const { asyncHandler } = require('../utils');

const getTags = asyncHandler(async (req, res) => {
  const tags = await tagService.getTags(req.user._id);
  res.json(tags);
});

const createTag = asyncHandler(async (req, res) => {
  const tag = await tagService.createTag(req.user._id, req.body);
  res.status(201).json(tag);
});

const updateTag = asyncHandler(async (req, res) => {
  const tag = await tagService.updateTag(req.user._id, req.params.id, req.body);
  res.json(tag);
});

const deleteTag = asyncHandler(async (req, res) => {
  const result = await tagService.deleteTag(req.user._id, req.params.id);
  res.json(result);
});

module.exports = { getTags, createTag, updateTag, deleteTag };
