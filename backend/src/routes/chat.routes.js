const express = require('express')
const {
    getConversations,
    getMessages,
    sendMessage,
    startConversation
} = require('../controllers/chat.controller')
const { protect } = require('../middleware/auth')

const router = express.Router()

router.use(protect) // All chat routes are protected

router.get('/conversations', getConversations)
router.get('/conversations/:id/messages', getMessages)
router.post('/messages', sendMessage)
router.post('/start', startConversation)

module.exports = router
