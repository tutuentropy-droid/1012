const Note = require('../models/Note');
const Work = require('../models/Work');
const { AppError, getPaginationParams, paginateResult } = require('../utils');

class NoteService {
  async getNotes(userId, query) {
    const { page, pageSize, skip } = getPaginationParams(query);
    const filter = { userId };

    if (query.workId) filter.workId = query.workId;
    if (query.moodColor) filter.moodColor = query.moodColor;
    if (query.search) filter.$text = { $search: query.search };

    const sortBy = query.sortBy || 'createdAt';
    const sortOrder = query.sortOrder === 'asc' ? 1 : -1;

    const [items, total] = await Promise.all([
      Note.find(filter)
        .populate('workId', 'title type')
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(pageSize)
        .lean(),
      Note.countDocuments(filter),
    ]);

    return paginateResult(items, total, page, pageSize);
  }

  async getNoteById(userId, noteId) {
    const note = await Note.findOne({ _id: noteId, userId }).populate('workId', 'title type');
    if (!note) {
      throw new AppError('笔记不存在', 404, 'NOT_FOUND');
    }
    return note;
  }

  async createNote(userId, data) {
    const work = await Work.findOne({ _id: data.workId, userId });
    if (!work) {
      throw new AppError('作品不存在', 404, 'NOT_FOUND');
    }
    const note = await Note.create({ ...data, userId });
    await note.populate('workId', 'title type');
    return note;
  }

  async updateNote(userId, noteId, data) {
    const note = await Note.findOne({ _id: noteId, userId });
    if (!note) {
      throw new AppError('笔记不存在', 404, 'NOT_FOUND');
    }
    Object.assign(note, data);
    await note.save();
    await note.populate('workId', 'title type');
    return note;
  }

  async deleteNote(userId, noteId) {
    const note = await Note.findOneAndDelete({ _id: noteId, userId });
    if (!note) {
      throw new AppError('笔记不存在', 404, 'NOT_FOUND');
    }
    return { success: true };
  }
}

module.exports = new NoteService();
