import mongoose from 'mongoose';

const artifactSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true,
      index: true,
    },
    messageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message',
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
      default: 'Untitled Artifact',
    },
    filename: {
      type: String,
      required: true,
      trim: true,
      maxlength: 255,
      default: 'document.txt',
    },
    type: {
      type: String,
      enum: ['code', 'markdown', 'document', 'data', 'html', 'svg', 'image'],
      default: 'code',
    },
    format: {
      type: String,
      trim: true,
      default: 'text',
    },
    mimeType: {
      type: String,
      trim: true,
      default: 'text/plain',
    },
    content: {
      type: String,
      required: true,
      default: '',
    },
    originalFileName: {
      type: String,
      trim: true,
    },
    originalFormat: {
      type: String,
      trim: true,
    },
    size: {
      type: Number,
      default: 0,
    },
    version: {
      type: Number,
      default: 1,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        ret.id = ret._id.toString();
        ret.conversationId = ret.conversationId ? ret.conversationId.toString() : '';
        ret.userId = ret.userId ? ret.userId.toString() : '';
        if (ret.messageId) {
          ret.messageId = ret.messageId.toString();
        }
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

artifactSchema.index({ userId: 1, updatedAt: -1, _id: -1 });
artifactSchema.index({ userId: 1, conversationId: 1, updatedAt: -1 });
artifactSchema.index({ userId: 1, title: 'text', filename: 'text' });

const MongooseArtifact = mongoose.model('Artifact', artifactSchema);

import { isDbConnected } from '../config/db.js';
import { DevArtifact } from '../services/devStore.js';

export const Artifact = new Proxy(MongooseArtifact, {
  get(target, prop) {
    if (!isDbConnected() && prop in DevArtifact) {
      return DevArtifact[prop];
    }
    return target[prop];
  },
});

