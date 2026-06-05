const Work = require('../models/Work');
const Note = require('../models/Note');
const Tag = require('../models/Tag');

class SearchService {
  async globalSearch(userId, query, scope = 'all') {
    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escaped, 'i');

    const result = { works: [], notes: [], tags: [] };

    if (scope === 'all' || scope === 'works') {
      result.works = await Work.find({
        userId,
        $or: [{ title: regex }, { author: regex }, { subtitle: regex }],
      })
        .limit(20)
        .sort({ updatedAt: -1 })
        .populate('tags', 'name color')
        .lean();
    }

    if (scope === 'all' || scope === 'notes') {
      result.notes = await Note.find({ userId, content: regex })
        .limit(20)
        .sort({ createdAt: -1 })
        .populate('workId', 'title type')
        .lean();
    }

    if (scope === 'all' || scope === 'tags') {
      result.tags = await Tag.find({ userId, name: regex }).limit(20).sort({ workCount: -1 }).lean();
    }

    return result;
  }
}

module.exports = new SearchService();
