import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    role: {
      type: String,
      enum: ['user', 'assistant'],
      required: true,
    },
    content: {
      type: String,
      default: '',
      maxlength: 20000,
    },
    attachment: {
      type: {
        type: String,
        enum: ['image', 'file'],
      },
      name: String,
      mimeType: String,
      size: Number,
      dataUrl: String,
    },
    metadata: {
      model: String,
      finishReason: String,
      latencyMs: Number,
      usage: {
        promptTokens: Number,
        completionTokens: Number,
      },
      sensitiveTopic: {
        type: Boolean,
        default: false,
      },
      contextTruncated: {
        type: Boolean,
        default: false,
      },
      sources: [
        {
          title: String,
          url: String,
        },
      ],
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    toJSON: {
      transform(doc, ret) {
        ret.id = ret._id.toString();
        ret.conversationId = ret.conversationId.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

messageSchema.index({ conversationId: 1, _id: 1 });
messageSchema.index({ conversationId: 1, createdAt: -1 });
messageSchema.index({ userId: 1, content: 'text' }, { default_language: 'none' });

const MongooseMessage = mongoose.model('Message', messageSchema);

import { isDbConnected } from '../config/db.js';
import { DevMessage } from '../services/devStore.js';

export const Message = new Proxy(MongooseMessage, {
  get(target, prop) {
    if (!isDbConnected() && prop in DevMessage) {
      return DevMessage[prop];
    }
    return target[prop];
  },
});
