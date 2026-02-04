const mongoose = require('mongoose')

/**
 * Message Model - Chat/Messaging
 * 
 * Features:
 *   - Proper indexing for conversation lookups
 *   - Read status tracking
 */

const messageSchema = new mongoose.Schema({
    conversation: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Conversation',
        required: true
        // Indexed via compound: { conversation: 1, createdAt: -1 }
    },
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
        // Not indexed - lookups are typically by conversation
    },
    content: {
        type: String,
        required: true
    },
    read: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
})

// ==========================================
// INDEXES
// ==========================================
// Compound index for fetching messages in a conversation chronologically
messageSchema.index({ conversation: 1, createdAt: -1 })
// Index for unread messages lookup
messageSchema.index({ conversation: 1, read: 1 })

const conversationSchema = new mongoose.Schema({
    participants: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    job: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Job'
    },
    lastMessage: {
        content: String,
        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        createdAt: Date
    },
    unreadCount: {
        type: Map,
        of: Number,
        default: {}
    }
}, {
    timestamps: true
})

conversationSchema.index({ participants: 1 })
conversationSchema.index({ updatedAt: -1 })

const Message = mongoose.model('Message', messageSchema)
const Conversation = mongoose.model('Conversation', conversationSchema)

module.exports = { Message, Conversation }
