const mongoose = require('mongoose');

const ConversationSchema = new mongoose.Schema({
  timestamp: { type: Date, default: Date.now },
  language: { type: String, enum: ['en', 'ar'], required: true },
  userMessage: { type: String, required: true },
  botResponse: { type: String, required: true },
  isCareerRelated: { type: Boolean, default: true },
  hasCvContext: { type: Boolean, default: false },
  sessionId: { type: String, required: true },
  metadata: {
    userAgent: String,
    ipAddress: String,
    referrer: String
  }
});

// Create indexes for better query performance
ConversationSchema.index({ timestamp: -1 });
ConversationSchema.index({ language: 1 });
ConversationSchema.index({ sessionId: 1 });

module.exports = mongoose.model('ConversationLog', ConversationSchema, 'conversation_logs');
