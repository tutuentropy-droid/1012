const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    workId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Work',
      required: true,
      index: true,
    },
    content: {
      type: String,
      required: true,
    },
    moodColor: {
      type: String,
      default: '',
    },
    location: {
      episode: Number,
      page: Number,
      chapter: String,
    },
    isPrivate: {
      type: Boolean,
      default: false,
    },
    attachments: [
      {
        type: String,
      },
    ],
    references: [
      {
        type: { type: String, enum: ['quote', 'link', 'note'] },
        target: mongoose.Schema.Types.ObjectId,
      },
    ],
  },
  {
    timestamps: true,
  }
);

noteSchema.index({ userId: 1, workId: 1 });
noteSchema.index({ userId: 1, createdAt: -1 });
noteSchema.index({ content: 'text' });

noteSchema.post('save', async function (doc) {
  const Work = require('./Work');
  await Work.findByIdAndUpdate(doc.workId, { $inc: { noteCount: 1 } });
});

noteSchema.post('findOneAndDelete', async function (doc) {
  if (doc) {
    const Work = require('./Work');
    await Work.findByIdAndUpdate(doc.workId, { $inc: { noteCount: -1 } });
  }
});

module.exports = mongoose.model('Note', noteSchema);
