import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 60,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
      index: true,
    },
    passwordHash: {
      type: String,
      select: false,
    },
    authProviders: {
      type: [String],
      enum: ['local', 'google'],
      default: ['local'],
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true,
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    avatarUrl: {
      type: String,
      default: '',
    },
    settings: {
      uiLanguage: {
        type: String,
        enum: ['en', 'hi'],
        default: 'en',
      },
      replyLanguage: {
        type: String,
        enum: ['auto', 'en', 'hi'],
        default: 'auto',
      },
      theme: {
        type: String,
        enum: ['light', 'dark', 'system'],
        default: 'light',
      },
      onboardingCompleted: {
        type: Boolean,
        default: false,
      },
      memoryEnabled: {
        type: Boolean,
        default: true,
      },
    },
    memories: [
      {
        id: {
          type: String,
          required: true,
        },
        text: {
          type: String,
          required: true,
          trim: true,
          maxlength: 500,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    tokenVersion: {
      type: Number,
      default: 0,
    },
    lastLoginAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        delete ret.passwordHash;
        return ret;
      },
    },
  }
);

const MongooseUser = mongoose.model('User', userSchema);

import { isDbConnected } from '../config/db.js';
import { DevUser } from '../services/devStore.js';

export const User = new Proxy(MongooseUser, {
  get(target, prop) {
    if (!isDbConnected() && prop in DevUser) {
      return DevUser[prop];
    }
    return target[prop];
  },
});
