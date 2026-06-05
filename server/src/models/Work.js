const mongoose = require('mongoose');

const workSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['tv', 'book', 'movie', 'other'],
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    subtitle: {
      type: String,
      trim: true,
      maxlength: 200,
      default: '',
    },
    author: {
      type: String,
      trim: true,
      maxlength: 100,
      default: '',
    },
    cover: {
      type: String,
      default: '',
    },
    description: {
      type: String,
      default: '',
    },
    totalEpisodes: {
      type: Number,
      default: 0,
    },
    totalPages: {
      type: Number,
      default: 0,
    },
    currentEpisode: {
      type: Number,
      default: 0,
    },
    currentPage: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['wish', 'watching', 'watched', 'paused', 'dropped'],
      default: 'wish',
      index: true,
    },
    rating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0,
    },
    startedAt: {
      type: Date,
    },
    finishedAt: {
      type: Date,
    },
    tags: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tag',
        index: true,
      },
    ],
    moodColor: {
      type: String,
      default: '',
    },
    noteCount: {
      type: Number,
      default: 0,
    },
    metadata: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
      default: {},
    },
    externalIds: [
      {
        source: String,
        id: String,
      },
    ],
    customFields: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

workSchema.index({ userId: 1, status: 1 });
workSchema.index({ userId: 1, type: 1 });
workSchema.index({ userId: 1, updatedAt: -1 });
workSchema.index({ title: 'text', author: 'text', description: 'text' });

workSchema.virtual('progressPercent').get(function () {
  if (this.type === 'tv' && this.totalEpisodes > 0) {
    return Math.min(100, Math.round((this.currentEpisode / this.totalEpisodes) * 100));
  }
  if ((this.type === 'book' || this.type === 'other') && this.totalPages > 0) {
    return Math.min(100, Math.round((this.currentPage / this.totalPages) * 100));
  }
  return 0;
});

workSchema.pre('save', function (next) {
  if (this.status === 'watching' && !this.startedAt) {
    this.startedAt = new Date();
  }
  if (this.status === 'watched' && !this.finishedAt) {
    this.finishedAt = new Date();
  }
  next();
});

module.exports = mongoose.model('Work', workSchema);
