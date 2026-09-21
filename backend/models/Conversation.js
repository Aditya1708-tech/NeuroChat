import mongoose from 'mongoose';

const conversationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      default: 'New chat',
      trim: true,
      maxlength: 100,
    },
    summary: {
      type: String,
    },
    summarizedUntil: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message',
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

conversationSchema.index({ userId: 1, updatedAt: -1, _id: -1 });
conversationSchema.index({ userId: 1, title: 1 });

const MongooseConversation = mongoose.model('Conversation', conversationSchema);

import { isDbConnected } from '../config/db.js';
import { DevConversation } from '../services/devStore.js';

export const Conversation = new Proxy(MongooseConversation, {
  get(target, prop) {
    if (!isDbConnected() && prop in DevConversation) {
      return DevConversation[prop];
    }
    return target[prop];
  },
});
