const Work = require('../models/Work');
const Tag = require('../models/Tag');
const Note = require('../models/Note');
const { AppError } = require('../utils');

const FIELD_ALIASES = {
  title: ['title', '题名', '标题', '名称', '书名', '剧名', 'name', '作品名'],
  subtitle: ['subtitle', '副标题', '别名', 'original_title', '原名'],
  author: ['author', '作者', '编剧', 'writer', 'creator'],
  directors: ['director', '导演', 'directors', '导'],
  actors: ['actors', '演员', '主演', 'cast', 'starring'],
  genres: ['genres', '类型', 'genre', '分类', '题材'],
  writers: ['writers', '编剧', 'screenwriter', 'script'],
  type: ['type', '类别', 'category', 'kind', 'media_type'],
  status: ['status', '状态', 'collect_status', 'my_status', '收藏状态'],
  rating: ['rating', '评分', 'my_rating', '个人评分', 'score', 'star'],
  totalEpisodes: ['total_episodes', '总集数', '集数', 'episodes', 'episodes_count'],
  totalPages: ['total_pages', '总页数', '页数', 'pages'],
  currentEpisode: ['current_episode', '已看集数', '看到', 'progress'],
  currentPage: ['current_page', '已读页数', '读到'],
  startedAt: ['started_at', '开始时间', 'start_date', '开始日期'],
  finishedAt: ['finished_at', '完成时间', 'end_date', '完成日期', '标记日期'],
  tags: ['tags', '标签', '我的标签', 'labels'],
  note: ['note', '笔记', 'comment', '短评', '评论', 'my_comment'],
  cover: ['cover', '封面', 'image', 'poster', '图片'],
  description: ['description', '简介', 'summary', '描述', 'introduction'],
};

const TYPE_MAP = {
  '剧集': 'tv', '电视剧': 'tv', 'tv': 'tv', 'tv series': 'tv', 'series': 'tv',
  '书籍': 'book', '图书': 'book', '书': 'book', 'book': 'book', 'ebook': 'book',
  '电影': 'movie', 'movie': 'movie', 'film': 'movie',
  '其他': 'book', 'other': 'book',
};

const STATUS_MAP = {
  '想看': 'wish', '想读': 'wish', '想看': 'wish', 'wish': 'wish', 'to-watch': 'wish', 'to-read': 'wish',
  '在看': 'watching', '在读': 'watching', 'watching': 'watching', 'reading': 'watching',
  '已看': 'watched', '已读': 'watched', '看过': 'watched', 'watched': 'watched', 'read': 'watched',
  '搁置': 'wish', '暂停': 'wish', 'paused': 'wish', 'on-hold': 'wish',
  '弃坑': 'wish', '弃': 'wish', 'dropped': 'wish', 'abandoned': 'wish',
};

class ImportService {
  normalizeFieldName(name) {
    const lower = name.toLowerCase().trim();
    for (const [field, aliases] of Object.entries(FIELD_ALIASES)) {
      if (aliases.some((a) => a.toLowerCase() === lower || a === name)) {
        return field;
      }
    }
    return null;
  }

  parseValue(field, value) {
    if (value === null || value === undefined) return undefined;
    if (typeof value === 'string' && value.trim() === '') return undefined;
    const str = String(value).trim();

    switch (field) {
      case 'type':
        return TYPE_MAP[str.toLowerCase()] || TYPE_MAP[str] || 'book';
      case 'status':
        return STATUS_MAP[str.toLowerCase()] || STATUS_MAP[str] || 'wish';
      case 'rating': {
        const num = parseFloat(str);
        if (isNaN(num)) return 0;
        if (num > 5) return Math.min(5, Math.round(num / 2));
        return Math.max(0, Math.min(5, Math.round(num)));
      }
      case 'totalEpisodes':
      case 'totalPages':
      case 'currentEpisode':
      case 'currentPage': {
        const n = parseInt(str, 10);
        return isNaN(n) ? 0 : n;
      }
      case 'startedAt':
      case 'finishedAt': {
        const d = new Date(str);
        return isNaN(d.getTime()) ? undefined : d;
      }
      case 'directors':
      case 'actors':
      case 'genres':
      case 'writers':
      case 'tags':
        return str
          .split(/[,，、;；\/|]/)
          .map((s) => s.trim())
          .filter(Boolean);
      default:
        return str;
    }
  }

  detectSeparator(line) {
    const counts = { ',': 0, ';': 0, '\t': 0, '，': 0 };
    for (const ch of line) {
      if (counts[ch] !== undefined) counts[ch]++;
    }
    let best = ',';
    let bestCount = 0;
    for (const [sep, count] of Object.entries(counts)) {
      if (count > bestCount) {
        best = sep;
        bestCount = count;
      }
    }
    return bestCount === 0 ? ',' : best;
  }

  parseCSV(content) {
    const lines = content.replace(/\r\n/g, '\n').split('\n').filter((l) => l.trim());
    if (lines.length === 0) return [];

    const separator = this.detectSeparator(lines[0]);
    const parseLine = (line) => {
      const result = [];
      let current = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') {
          if (inQuotes && line[i + 1] === '"') {
            current += '"';
            i++;
          } else {
            inQuotes = !inQuotes;
          }
        } else if (ch === separator && !inQuotes) {
          result.push(current);
          current = '';
        } else {
          current += ch;
        }
      }
      result.push(current);
      return result.map((s) => s.replace(/^"|"$/g, '').replace(/""/g, '"'));
    };

    const headers = parseLine(lines[0]);
    const records = [];
    for (let i = 1; i < lines.length; i++) {
      const values = parseLine(lines[i]);
      const row = {};
      headers.forEach((h, idx) => {
        const field = this.normalizeFieldName(h);
        if (field) {
          row[field] = this.parseValue(field, values[idx]);
        } else {
          row[h] = values[idx];
        }
      });
      records.push(row);
    }
    return records;
  }

  parseSimple(content) {
    const lines = content.replace(/\r\n/g, '\n').split('\n').filter((l) => l.trim());
    return lines.map((line) => {
      const trimmed = line.trim();
      if (trimmed.startsWith('《') && trimmed.includes('》')) {
        const titleMatch = trimmed.match(/《([^》]+)》/);
        const title = titleMatch ? titleMatch[1] : trimmed;
        const rest = trimmed.replace(/《[^》]+》/, '').trim();
        return { title, raw: rest };
      }
      return { title: trimmed };
    });
  }

  async findDuplicate(userId, record) {
    const title = record.title;
    if (!title) return null;
    const normalizedTitle = title.toLowerCase().trim();

    const existing = await Work.findOne({
      userId,
      $or: [
        { title: { $regex: new RegExp(`^${this.escapeRegex(normalizedTitle)}$`, 'i') } },
        { subtitle: { $regex: new RegExp(`^${this.escapeRegex(normalizedTitle)}$`, 'i') } },
      ],
    });
    return existing;
  }

  escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  mergeWorks(existing, record) {
    const merged = { ...existing.toObject() };

    for (const key of Object.keys(record)) {
      if (record[key] === undefined || record[key] === null) continue;
      if (['tags', 'note'].includes(key)) continue;

      const existingVal = merged[key];
      const newVal = record[key];

      if (Array.isArray(newVal)) {
        const combined = Array.from(new Set([...(existingVal || []), ...newVal]));
        merged[key] = combined;
      } else if (typeof newVal === 'string' && newVal && !existingVal) {
        merged[key] = newVal;
      } else if (typeof newVal === 'number' && !existingVal) {
        merged[key] = newVal;
      } else if (newVal instanceof Date && !existingVal) {
        merged[key] = newVal;
      }
    }

    if (!merged.author && record.author) merged.author = record.author;
    if (!merged.rating && record.rating) merged.rating = record.rating;
    if (!merged.status || merged.status === 'wish' && record.status !== 'wish') {
      merged.status = record.status || merged.status;
    }
    if (!merged.type) {
      merged.type = record.type || merged.type;
    }

    return merged;
  }

  async ensureTags(userId, tagNames) {
    if (!tagNames || tagNames.length === 0) return [];
    const { FIXED_TAGS } = require('../data/constants');
    const FIXED_TAG_NAMES = FIXED_TAGS.map((t) => t.name);
    const tagIds = [];

    for (const name of tagNames) {
      if (!FIXED_TAG_NAMES.includes(name)) continue;
      let tag = await Tag.findOne({ userId, name });
      if (!tag) {
        const fixedTag = FIXED_TAGS.find((t) => t.name === name);
        tag = await Tag.create({ userId, name, color: fixedTag.color, workCount: 0 });
      }
      tagIds.push(tag._id);
    }
    return tagIds;
  }

  async processImport(userId, records) {
    const matched = [];
    const unmatched = [];
    const errors = [];
    const tagCache = {};

    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      if (!record.title || !String(record.title).trim()) {
        errors.push({ index: i, record, reason: '缺少题名' });
        continue;
      }

      try {
        const existing = await this.findDuplicate(userId, record);
        if (existing) {
          matched.push({
            index: i,
            record,
            existingId: existing._id.toString(),
            existingTitle: existing.title,
            merged: this.mergeWorks(existing, record),
            tags: record.tags || [],
            note: record.note,
          });
        } else {
          unmatched.push({
            index: i,
            record,
            suggestedType: this.suggestType(record),
            tags: record.tags || [],
            note: record.note,
          });
        }
      } catch (e) {
        errors.push({ index: i, record, reason: e.message });
      }
    }

    return {
      total: records.length,
      matched: matched.length,
      unmatched: unmatched.length,
      errorCount: errors.length,
      matchedItems: matched,
      unmatchedItems: unmatched,
      errors,
    };
  }

  suggestType(record) {
    if (record.type && record.type !== 'other') return record.type;
    if (record.directors || record.actors) return 'movie';
    if (record.totalPages !== undefined || record.currentPage) return 'book';
    if (record.totalEpisodes !== undefined || record.currentEpisode) return 'tv';
    return 'book';
  }

  async confirmImport(userId, action, matchedIds, unmatchedItems) {
    const created = [];
    const updated = [];
    const skipped = [];

    if (action === 'merge' || action === 'all') {
      for (const match of matchedIds) {
        try {
          const item = match;
          const existing = await Work.findById(item.existingId);
          if (!existing) {
            skipped.push(item);
            continue;
          }
          const merged = item.merged;
          delete merged._id;
          delete merged.__v;
          Object.assign(existing, merged);

          if (item.tags && item.tags.length > 0) {
            const tagIds = await this.ensureTags(userId, item.tags);
            existing.tags = Array.from(new Set([...(existing.tags || []), ...tagIds]));
            await Tag.updateMany({ _id: { $in: tagIds }, userId }, { $inc: { workCount: 1 } });
          }

          await existing.save();
          if (item.note && item.note.trim()) {
            await Note.create({
              userId,
              workId: existing._id,
              content: item.note,
              isPrivate: false,
            });
          }
          updated.push(existing._id);
        } catch (e) {
          skipped.push(match);
        }
      }
    } else {
      skipped.push(...matchedIds);
    }

    for (const item of unmatchedItems) {
      try {
        const workData = {
          userId,
          type: item.type || item.suggestedType || 'book',
          title: item.record.title,
          subtitle: item.record.subtitle || '',
          author: item.record.author || '',
          directors: item.record.directors || [],
          actors: item.record.actors || [],
          genres: item.record.genres || [],
          writers: item.record.writers || [],
          cover: item.record.cover || '',
          description: item.record.description || '',
          totalEpisodes: item.record.totalEpisodes || 0,
          totalPages: item.record.totalPages || 0,
          currentEpisode: item.record.currentEpisode || 0,
          currentPage: item.record.currentPage || 0,
          status: item.status || item.record.status || 'wish',
          rating: item.rating || item.record.rating || 0,
          startedAt: item.record.startedAt,
          finishedAt: item.record.finishedAt,
          moodColor: item.record.moodColor || '',
        };

        if (item.tags && item.tags.length > 0) {
          const tagIds = await this.ensureTags(userId, item.tags);
          workData.tags = tagIds;
        }

        const work = await Work.create(workData);
        if (workData.tags && workData.tags.length > 0) {
          await Tag.updateMany(
            { _id: { $in: workData.tags }, userId },
            { $inc: { workCount: 1 } }
          );
        }

        if (item.note && item.note.trim()) {
          await Note.create({
            userId,
            workId: work._id,
            content: item.note,
            isPrivate: false,
          });
        }
        created.push(work._id);
      } catch (e) {
        skipped.push(item);
      }
    }

    return { created: created.length, updated: updated.length, skipped: skipped.length, createdIds: created, updatedIds: updated };
  }
}

module.exports = new ImportService();
