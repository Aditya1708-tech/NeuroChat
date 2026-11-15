import mongoose from 'mongoose';

const imageSchema = new mongoose.Schema(
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
      index: true,
    },
    prompt: {
      type: String,
      required: true,
      trim: true,
      maxlength: 4000,
    },
    enhancedPrompt: {
      type: String,
      trim: true,
      maxlength: 8000,
      default: '',
    },
    model: {
      type: String,
      required: true,
      trim: true,
      default: 'gemini-3.1-flash-image',
    },
    style: {
      type: String,
      trim: true,
      default: 'realistic',
    },
    aspectRatio: {
      type: String,
      trim: true,
      default: '1:1',
    },
    filename: {
      type: String,
      required: true,
      trim: true,
    },
    filePath: {
      type: String,
      trim: true,
      default: '',
    },
    url: {
      type: String,
      required: true,
      trim: true,
    },
    mimeType: {
      type: String,
      trim: true,
      default: 'image/png',
    },
    format: {
      type: String,
      trim: true,
      default: 'png',
    },
    size: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['completed', 'failed'],
      default: 'completed',
    },
    error: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        ret.id = ret._id.toString();
        ret.userId = ret.userId ? ret.userId.toString() : '';
        if (ret.conversationId) {
          ret.conversationId = ret.conversationId.toString();
        }
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

imageSchema.index({ userId: 1, createdAt: -1 });

export const Image = mongoose.models.Image || mongoose.model('Image', imageSchema);

