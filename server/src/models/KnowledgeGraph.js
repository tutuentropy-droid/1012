const mongoose = require('mongoose');

const kgNodeAnnotationSchema = new mongoose.Schema(
  {
    content: {
      type: String,
      required: true,
      maxlength: 500,
    },
  },
  {
    timestamps: true,
    _id: true,
  }
);

const kgNodeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    category: {
      type: String,
      enum: ['person', 'place', 'era', 'imagery', 'theme', 'work'],
      required: true,
      index: true,
    },
    frequency: {
      type: Number,
      default: 1,
      min: 0,
    },
    synonyms: {
      type: [String],
      default: [],
    },
    isHidden: {
      type: Boolean,
      default: false,
      index: true,
    },
    annotations: {
      type: [kgNodeAnnotationSchema],
      default: [],
    },
    firstSeenAt: {
      type: Date,
      required: true,
    },
    lastSeenAt: {
      type: Date,
      required: true,
    },
    noteIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Note',
      },
    ],
    workIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Work',
      },
    ],
    position: {
      x: Number,
      y: Number,
    },
    cluster: String,
  },
  {
    _id: true,
  }
);

const kgEdgeSchema = new mongoose.Schema(
  {
    source: {
      type: String,
      required: true,
    },
    target: {
      type: String,
      required: true,
    },
    weight: {
      type: Number,
      default: 1,
      min: 0,
    },
    type: {
      type: String,
      enum: ['cooccurrence', 'manual'],
      default: 'cooccurrence',
      index: true,
    },
    noteIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Note',
      },
    ],
  },
  {
    timestamps: true,
    _id: true,
  }
);

const kgClusterSchema = new mongoose.Schema(
  {
    label: {
      type: String,
      required: true,
      maxlength: 50,
    },
    nodeIds: {
      type: [String],
      default: [],
    },
    color: {
      type: String,
      default: '#8B6914',
    },
  },
  {
    _id: true,
  }
);

const kgTimelineSnapshotSchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      required: true,
    },
    quarter: {
      type: String,
      required: true,
    },
    newNodes: {
      type: [String],
      default: [],
    },
    newEdges: {
      type: [String],
      default: [],
    },
    summary: {
      type: String,
      default: '',
    },
    topTerms: {
      type: [String],
      default: [],
    },
  },
  {
    _id: true,
  }
);

const knowledgeGraphSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    nodes: {
      type: [kgNodeSchema],
      default: [],
    },
    edges: {
      type: [kgEdgeSchema],
      default: [],
    },
    clusters: {
      type: [kgClusterSchema],
      default: [],
    },
    timeline: {
      type: [kgTimelineSnapshotSchema],
      default: [],
    },
    totalNotes: {
      type: Number,
      default: 0,
    },
    totalWorks: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

knowledgeGraphSchema.index({ userId: 1, 'nodes.category': 1 });

module.exports = mongoose.model('KnowledgeGraph', knowledgeGraphSchema);
