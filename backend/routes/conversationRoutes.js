const express = require('express');
const {
  createConversation,
  getConversations,
  getConversation,
  deleteConversation,
  sendMessage
} = require('../controllers/conversationController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// All conversation routes are protected
router.use(protect);

router.post('/', createConversation);
router.get('/', getConversations);
router.get('/:id', getConversation);
router.delete('/:id', deleteConversation);
router.post('/:id/messages', sendMessage);

module.exports = router;
