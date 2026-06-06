const importService = require('../services/importService');
const { asyncHandler, AppError } = require('../utils');

const previewImport = asyncHandler(async (req, res) => {
  const { content, format = 'csv' } = req.body;
  if (!content) {
    throw new AppError('请上传文件内容', 400, 'VALIDATION_ERROR');
  }

  let records = [];
  if (format === 'csv') {
    records = importService.parseCSV(content);
  } else if (format === 'simple') {
    records = importService.parseSimple(content);
  } else {
    records = importService.parseCSV(content);
  }

  if (records.length === 0) {
    throw new AppError('未解析到任何记录', 400, 'VALIDATION_ERROR');
  }

  const result = await importService.processImport(req.user._id, records);
  res.json(result);
});

const confirmImport = asyncHandler(async (req, res) => {
  const { action = 'merge', matchedItems = [], unmatchedItems = [] } = req.body;
  const result = await importService.confirmImport(req.user._id, action, matchedItems, unmatchedItems);
  res.json(result);
});

module.exports = { previewImport, confirmImport };
