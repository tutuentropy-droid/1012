const Tag = require('../models/Tag');
const Work = require('../models/Work');
const { FIXED_TAGS } = require('../data/constants');
const { AppError } = require('../utils');

const FIXED_TAG_NAMES = FIXED_TAGS.map((t) => t.name);

class TagService {
  async ensureFixedTags(userId) {
    const existing = await Tag.find({ userId }).lean();
    const existingNames = new Set(existing.map((t) => t.name));
    const toCreate = FIXED_TAGS.filter((t) => !existingNames.has(t.name));

    if (toCreate.length > 0) {
      await Tag.insertMany(
        toCreate.map((t) => ({ ...t, userId, workCount: 0 }))
      );
    }

    return Tag.find({ userId }).sort({ workCount: -1, createdAt: -1 }).lean();
  }

  async getTags(userId) {
    return this.ensureFixedTags(userId);
  }

  async createTag(userId, data) {
    if (!FIXED_TAG_NAMES.includes(data.name)) {
      throw new AppError('签花为系统固定分类，不可自定义', 400, 'VALIDATION_ERROR');
    }
    const existing = await Tag.findOne({ userId, name: data.name });
    if (existing) {
      return existing;
    }
    const fixedTag = FIXED_TAGS.find((t) => t.name === data.name);
    return Tag.create({ ...fixedTag, userId, workCount: 0 });
  }

  async updateTag(userId, tagId, data) {
    throw new AppError('签花为系统固定分类，不可修改', 400, 'VALIDATION_ERROR');
  }

  async deleteTag(userId, tagId) {
    throw new AppError('签花为系统固定分类，不可删除', 400, 'VALIDATION_ERROR');
  }
}

module.exports = new TagService();
