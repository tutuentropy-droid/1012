const Tag = require('../models/Tag');
const Work = require('../models/Work');
const { AppError } = require('../utils');

class TagService {
  async getTags(userId) {
    return Tag.find({ userId }).sort({ workCount: -1, createdAt: -1 }).lean();
  }

  async createTag(userId, data) {
    const existing = await Tag.findOne({ userId, name: data.name });
    if (existing) {
      throw new AppError('标签已存在', 400, 'VALIDATION_ERROR');
    }
    return Tag.create({ ...data, userId });
  }

  async updateTag(userId, tagId, data) {
    const tag = await Tag.findOne({ _id: tagId, userId });
    if (!tag) {
      throw new AppError('标签不存在', 404, 'NOT_FOUND');
    }
    if (data.name && data.name !== tag.name) {
      const existing = await Tag.findOne({ userId, name: data.name });
      if (existing) {
        throw new AppError('标签名已存在', 400, 'VALIDATION_ERROR');
      }
    }
    Object.assign(tag, data);
    await tag.save();
    return tag;
  }

  async deleteTag(userId, tagId) {
    const tag = await Tag.findOne({ _id: tagId, userId });
    if (!tag) {
      throw new AppError('标签不存在', 404, 'NOT_FOUND');
    }
    await Work.updateMany({ userId, tags: tagId }, { $pull: { tags: tagId } });
    await Tag.deleteOne({ _id: tagId, userId });
    return { success: true };
  }
}

module.exports = new TagService();
