const mongoose = require('mongoose');
const connectDB = require('../config/db');
const logger = require('../config/logger');
const Work = require('../models/Work');
const Note = require('../models/Note');
const Tag = require('../models/Tag');
const { FIXED_TAGS, CHINESE_COLORS } = require('../data/constants');

const MOOD_COLOR_MIGRATION_MAP = {
  '#D6E4FF': '#D6E4FF',
  '#4A5568': '#9370DB',
  '#C84032': '#C84032',
  '#F0E68C': '#F0E68C',
  '#7BA05B': '#7BA05B',
  '#E6B8CF': '#9370DB',
  '#8B6914': '#8B6914',
  '#C0C0C0': '#D6E4FF',
  '#9370DB': '#9370DB',
  '#48C9B0': '#7BA05B',
  '#8B0000': '#C84032',
  '#5F9EA0': '#9370DB',
  '#D9B64C': '#F0E68C',
  '#789262': '#7BA05B',
  '#9D2933': '#C84032',
  '#1661AB': '#8B6914',
};

const STATUS_MIGRATION_MAP = {
  paused: 'wish',
  dropped: 'wish',
};

const TYPE_MIGRATION_MAP = {
  other: 'book',
};

const FIXED_TAG_NAMES = FIXED_TAGS.map((t) => t.name);
const NEW_COLOR_HEXES = CHINESE_COLORS.map((c) => c.hex);

async function migrateStatusAndType() {
  logger.info('开始迁移状态和类型...');

  const typeResult = await Work.updateMany(
    { type: 'other' },
    { $set: { type: 'book' } }
  );
  logger.info(`类型迁移：将 ${typeResult.modifiedCount} 条 "其他" 改为 "书籍"`);

  const pausedResult = await Work.updateMany(
    { status: 'paused' },
    { $set: { status: 'wish' } }
  );
  logger.info(`状态迁移：将 ${pausedResult.modifiedCount} 条 "搁置" 改为 "想看"`);

  const droppedResult = await Work.updateMany(
    { status: 'dropped' },
    { $set: { status: 'wish' } }
  );
  logger.info(`状态迁移：将 ${droppedResult.modifiedCount} 条 "弃坑" 改为 "想看"`);
}

async function migrateMoodColors() {
  logger.info('开始迁移心情色...');

  const oldColors = Object.keys(MOOD_COLOR_MIGRATION_MAP).filter(
    (c) => !NEW_COLOR_HEXES.includes(c)
  );

  let workMigrated = 0;
  let noteMigrated = 0;

  for (const oldColor of oldColors) {
    const newColor = MOOD_COLOR_MIGRATION_MAP[oldColor];
    if (!newColor) continue;

    const workResult = await Work.updateMany(
      { moodColor: oldColor },
      { $set: { moodColor: newColor } }
    );
    workMigrated += workResult.modifiedCount;

    const noteResult = await Note.updateMany(
      { moodColor: oldColor },
      { $set: { moodColor: newColor } }
    );
    noteMigrated += noteResult.modifiedCount;

    if (workResult.modifiedCount > 0 || noteResult.modifiedCount > 0) {
      logger.info(
        `心情色迁移：${oldColor} → ${newColor}，作品 ${workResult.modifiedCount} 条，批注 ${noteResult.modifiedCount} 条`
      );
    }
  }

  logger.info(`心情色迁移完成：作品 ${workMigrated} 条，批注 ${noteMigrated} 条`);
}

async function migrateTags() {
  logger.info('开始迁移签花（标签）为固定分类...');

  const users = await Work.aggregate([
    { $group: { _id: '$userId' } },
  ]);
  const userIds = users.map((u) => u._id);

  let customTagsRemoved = 0;
  let fixedTagsEnsured = 0;

  for (const userId of userIds) {
    const existingTags = await Tag.find({ userId }).lean();
    const existingNameMap = new Map(existingTags.map((t) => [t.name, t]));

    for (const fixedTag of FIXED_TAGS) {
      if (!existingNameMap.has(fixedTag.name)) {
        await Tag.create({
          userId,
          name: fixedTag.name,
          color: fixedTag.color,
          workCount: 0,
        });
        fixedTagsEnsured++;
      } else {
        const existing = existingNameMap.get(fixedTag.name);
        if (existing.color !== fixedTag.color) {
          await Tag.updateOne(
            { _id: existing._id },
            { $set: { color: fixedTag.color } }
          );
        }
      }
    }

    const allTags = await Tag.find({ userId }).lean();
    const customTags = allTags.filter((t) => !FIXED_TAG_NAMES.includes(t.name));

    for (const customTag of customTags) {
      await Work.updateMany(
        { userId, tags: customTag._id },
        { $pull: { tags: customTag._id } }
      );
      await Tag.deleteOne({ _id: customTag._id });
      customTagsRemoved++;
      logger.info(`移除自定义签花："${customTag.name}"（用户 ${userId}）`);
    }
  }

  logger.info(
    `签花迁移完成：补建固定签花 ${fixedTagsEnsured} 个，移除自定义签花 ${customTagsRemoved} 个`
  );
}

async function recalculateTagWorkCounts() {
  logger.info('开始重新计算签花作品数...');

  const allTags = await Tag.find({}).lean();

  for (const tag of allTags) {
    const count = await Work.countDocuments({
      userId: tag.userId,
      tags: tag._id,
    });
    if (count !== tag.workCount) {
      await Tag.updateOne(
        { _id: tag._id },
        { $set: { workCount: count } }
      );
    }
  }

  logger.info(`签花作品数重算完成，共 ${allTags.length} 个签花`);
}

async function runMigration() {
  try {
    await connectDB();
    logger.info('========================================');
    logger.info('开始执行数据迁移');
    logger.info('========================================');

    await migrateStatusAndType();
    await migrateMoodColors();
    await migrateTags();
    await recalculateTagWorkCounts();

    logger.info('========================================');
    logger.info('数据迁移全部完成 ✅');
    logger.info('========================================');
    process.exit(0);
  } catch (error) {
    logger.error('数据迁移失败:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  runMigration();
}

module.exports = {
  runMigration,
  migrateStatusAndType,
  migrateMoodColors,
  migrateTags,
  recalculateTagWorkCounts,
  MOOD_COLOR_MIGRATION_MAP,
  STATUS_MIGRATION_MAP,
  TYPE_MIGRATION_MAP,
};
