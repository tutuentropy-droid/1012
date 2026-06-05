const Work = require('../models/Work');
const Tag = require('../models/Tag');
const Note = require('../models/Note');
const { AppError, getPaginationParams, paginateResult } = require('../utils');

class WorkService {
  async getWorks(userId, query) {
    const { page, pageSize, skip } = getPaginationParams(query);
    const filter = { userId };

    if (query.type && query.type !== 'all') filter.type = query.type;
    if (query.status && query.status !== 'all') filter.status = query.status;
    if (query.tagId) filter.tags = query.tagId;
    if (query.search) {
      filter.$text = { $search: query.search };
    }

    const sortBy = query.sortBy || 'updatedAt';
    const sortOrder = query.sortOrder === 'asc' ? 1 : -1;

    const [items, total] = await Promise.all([
      Work.find(filter)
        .populate('tags', 'name color')
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(pageSize)
        .lean(),
      Work.countDocuments(filter),
    ]);

    return paginateResult(items, total, page, pageSize);
  }

  async getWorkById(userId, workId) {
    const work = await Work.findOne({ _id: workId, userId }).populate('tags', 'name color');
    if (!work) {
      throw new AppError('作品不存在', 404, 'NOT_FOUND');
    }
    const notes = await Note.find({ userId, workId }).sort({ createdAt: -1 }).lean();
    return { ...work.toJSON(), notes };
  }

  async createWork(userId, data) {
    const work = await Work.create({ ...data, userId });
    await work.populate('tags', 'name color');
    if (data.tags && data.tags.length > 0) {
      await Tag.updateMany(
        { _id: { $in: data.tags }, userId },
        { $inc: { workCount: 1 } }
      );
    }
    return work.toJSON();
  }

  async updateWork(userId, workId, data) {
    const work = await Work.findOne({ _id: workId, userId });
    if (!work) {
      throw new AppError('作品不存在', 404, 'NOT_FOUND');
    }

    if (data.tags) {
      const oldTags = work.tags.map((t) => t.toString());
      const newTags = data.tags;
      const removed = oldTags.filter((t) => !newTags.includes(t));
      const added = newTags.filter((t) => !oldTags.includes(t));
      if (removed.length) {
        await Tag.updateMany({ _id: { $in: removed }, userId }, { $inc: { workCount: -1 } });
      }
      if (added.length) {
        await Tag.updateMany({ _id: { $in: added }, userId }, { $inc: { workCount: 1 } });
      }
    }

    Object.assign(work, data);
    await work.save();
    await work.populate('tags', 'name color');
    return work.toJSON();
  }

  async deleteWork(userId, workId) {
    const work = await Work.findOne({ _id: workId, userId });
    if (!work) {
      throw new AppError('作品不存在', 404, 'NOT_FOUND');
    }
    if (work.tags.length) {
      await Tag.updateMany(
        { _id: { $in: work.tags }, userId },
        { $inc: { workCount: -1 } }
      );
    }
    await Note.deleteMany({ userId, workId });
    await Work.deleteOne({ _id: workId, userId });
    return { success: true };
  }

  async updateProgress(userId, workId, data) {
    return this.updateWork(userId, workId, data);
  }

  async updateRating(userId, workId, rating, moodColor) {
    return this.updateWork(userId, workId, { rating, ...(moodColor ? { moodColor } : {}) });
  }
}

module.exports = new WorkService();
