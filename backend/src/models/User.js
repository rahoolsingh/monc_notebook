import mongoose from 'mongoose';

const chatMessageSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ['user', 'assistant'],
    required: true
  },
  content: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

const fileSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true
  },
  originalName: {
    type: String,
    required: true
  },
  filename: {
    type: String,
    required: true
  },
  filePath: {
    type: String,
    required: true
  },
  fileType: {
    type: String,
    required: true
  },
  fileSize: {
    type: Number,
    default: 0
  },
  collectionName: {
    type: String,
    required: true
  },
  processedPages: {
    type: Number,
    default: 0
  },
  sourceUrl: {
    type: String,
    required: false
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  }
});

const userSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  files: [fileSchema],
  chatHistory: [chatMessageSchema],
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastActive: {
    type: Date,
    default: Date.now
  }
});

// Update lastActive on every save
userSchema.pre('save', function(next) {
  this.lastActive = new Date();
  next();
});

export const User = mongoose.model('User', userSchema);