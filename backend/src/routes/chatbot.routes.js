const express = require('express')
const { sendMessage, getHealth } = require('../controllers/chatbot.controller')

const router = express.Router()

// Public routes - chatbot is available to everyone
router.post('/message', sendMessage)
router.get('/health', getHealth)

module.exports = router
