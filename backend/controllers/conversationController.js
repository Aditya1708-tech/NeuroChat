const mongoose = require('mongoose');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const { generateResponse } = require('../services/geminiService');

// @desc    Create a new conversation
// @route   POST /api/conversations
const createConversation = async (req, res) => {
  try {
    const conversation = await Conversation.create({
      userId: req.user.id
    });

    res.status(201).json({
      success: true,
      conversation
    });
  } catch (error) {
    console.error('Create conversation error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to create conversation'
    });
  }
};

// @desc    Get all conversations for the authenticated user
// @route   GET /api/conversations
const getConversations = async (req, res) => {
  try {
    const conversations = await Conversation.find({ userId: req.user.id })
      .sort({ updatedAt: -1 })
      .select('title createdAt updatedAt');

    res.json({
      success: true,
      conversations
    });
  } catch (error) {
    console.error('Get conversations error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to load conversations'
    });
  }
};

// @desc    Get a single conversation with its messages
// @route   GET /api/conversations/:id
const getConversation = async (req, res) => {
  try {
    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid conversation ID'
      });
    }

    const conversation = await Conversation.findById(req.params.id);

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    // Ownership check
    if (conversation.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this conversation'
      });
    }

    // Load messages in chronological order
    const messages = await Message.find({ conversationId: conversation._id })
      .sort({ createdAt: 1 })
      .select('role content createdAt');

    res.json({
      success: true,
      conversation: {
        _id: conversation._id,
        title: conversation.title,
        createdAt: conversation.createdAt,
        updatedAt: conversation.updatedAt
      },
      messages
    });
  } catch (error) {
    console.error('Get conversation error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to load conversation'
    });
  }
};

// @desc    Delete a conversation and all its messages
// @route   DELETE /api/conversations/:id
const deleteConversation = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid conversation ID'
      });
    }

    const conversation = await Conversation.findById(req.params.id);

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    // Ownership check
    if (conversation.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this conversation'
      });
    }

    // Delete all messages in the conversation
    await Message.deleteMany({ conversationId: conversation._id });

    // Delete the conversation
    await Conversation.findByIdAndDelete(conversation._id);

    res.json({
      success: true,
      message: 'Conversation deleted'
    });
  } catch (error) {
    console.error('Delete conversation error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to delete conversation'
    });
  }
};

// @desc    Send a message and get AI response
// @route   POST /api/conversations/:id/messages
const sendMessage = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid conversation ID'
      });
    }

    const { message } = req.body;

    // Validate message
    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Message cannot be empty'
      });
    }

    const conversation = await Conversation.findById(req.params.id);

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    // Ownership check
    if (conversation.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this conversation'
      });
    }

    // Load previous messages for context
    const previousMessages = await Message.find({ conversationId: conversation._id })
      .sort({ createdAt: 1 })
      .select('role content');

    // Save the user's message
    const userMessage = await Message.create({
      conversationId: conversation._id,
      role: 'user',
      content: message.trim()
    });

    // Generate AI response with conversation history
    let aiResponseText;
    try {
      aiResponseText = await generateResponse(previousMessages, message.trim());
    } catch (geminiError) {
      console.error('Gemini error:', geminiError.message);

      // Still save the user message but return error for AI
      return res.status(502).json({
        success: false,
        message: 'AI service is temporarily unavailable. Please try again.',
        userMessage: {
          _id: userMessage._id,
          role: userMessage.role,
          content: userMessage.content,
          createdAt: userMessage.createdAt
        }
      });
    }

    // Save the AI response
    const aiMessage = await Message.create({
      conversationId: conversation._id,
      role: 'model',
      content: aiResponseText
    });

    // Update conversation title from first user message
    if (conversation.title === 'New Conversation') {
      const truncatedTitle = message.trim().length > 50
        ? message.trim().substring(0, 50) + '...'
        : message.trim();
      conversation.title = truncatedTitle;
    }

    // Touch updatedAt so conversation appears at top of list
    conversation.updatedAt = new Date();
    await conversation.save();

    res.json({
      success: true,
      userMessage: {
        _id: userMessage._id,
        role: userMessage.role,
        content: userMessage.content,
        createdAt: userMessage.createdAt
      },
      aiMessage: {
        _id: aiMessage._id,
        role: aiMessage.role,
        content: aiMessage.content,
        createdAt: aiMessage.createdAt
      },
      conversationTitle: conversation.title
    });
  } catch (error) {
    console.error('Send message error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to send message'
    });
  }
};

module.exports = {
  createConversation,
  getConversations,
  getConversation,
  deleteConversation,
  sendMessage
};
