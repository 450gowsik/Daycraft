const { Message, Conversation } = require('../models/Message')
const User = require('../models/User')

// @desc    Get user's conversations
// @route   GET /api/chat/conversations
exports.getConversations = async (req, res) => {
    try {
        const conversations = await Conversation.find({
            participants: req.user.id
        })
            .populate('participants', 'name avatar role')
            .populate('job', 'title')
            .sort({ updatedAt: -1 })

        res.json({
            success: true,
            conversations
        })
    } catch (error) {
        console.error('Get conversations error:', error)
        res.status(500).json({
            success: false,
            message: 'Failed to fetch conversations'
        })
    }
}

// @desc    Get messages in a conversation
// @route   GET /api/chat/conversations/:id/messages
exports.getMessages = async (req, res) => {
    try {
        const conversation = await Conversation.findById(req.params.id)

        if (!conversation) {
            return res.status(404).json({
                success: false,
                message: 'Conversation not found'
            })
        }

        // Check if user is participant
        if (!conversation.participants.includes(req.user.id)) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to view this conversation'
            })
        }

        const messages = await Message.find({ conversation: req.params.id })
            .populate('sender', 'name avatar')
            .sort({ createdAt: 1 })

        // Mark messages as read
        await Message.updateMany(
            {
                conversation: req.params.id,
                sender: { $ne: req.user.id },
                read: false
            },
            { read: true }
        )

        res.json({
            success: true,
            messages
        })
    } catch (error) {
        console.error('Get messages error:', error)
        res.status(500).json({
            success: false,
            message: 'Failed to fetch messages'
        })
    }
}

// @desc    Send a message
// @route   POST /api/chat/messages
exports.sendMessage = async (req, res) => {
    try {
        const { receiverId, content, jobId } = req.body

        if (!content || !receiverId) {
            return res.status(400).json({
                success: false,
                message: 'Receiver and content are required'
            })
        }

        // Find or create conversation
        let conversation = await Conversation.findOne({
            participants: { $all: [req.user.id, receiverId] }
        })

        if (!conversation) {
            conversation = await Conversation.create({
                participants: [req.user.id, receiverId],
                job: jobId || null
            })
        }

        // Create message
        const message = await Message.create({
            conversation: conversation._id,
            sender: req.user.id,
            content
        })

        // Update conversation
        conversation.lastMessage = {
            content,
            sender: req.user.id,
            createdAt: new Date()
        }
        await conversation.save()

        // Populate sender info
        await message.populate('sender', 'name avatar')

        res.status(201).json({
            success: true,
            message
        })
    } catch (error) {
        console.error('Send message error:', error)
        res.status(500).json({
            success: false,
            message: 'Failed to send message'
        })
    }
}

// @desc    Start conversation with user
// @route   POST /api/chat/start
exports.startConversation = async (req, res) => {
    try {
        const { userId, jobId } = req.body

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'User ID is required'
            })
        }

        // Check if user exists
        const otherUser = await User.findById(userId)
        if (!otherUser) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            })
        }

        // Find existing conversation or create new
        let conversation = await Conversation.findOne({
            participants: { $all: [req.user.id, userId] }
        }).populate('participants', 'name avatar role')

        if (!conversation) {
            conversation = await Conversation.create({
                participants: [req.user.id, userId],
                job: jobId || null
            })
            await conversation.populate('participants', 'name avatar role')
        }

        res.json({
            success: true,
            conversation
        })
    } catch (error) {
        console.error('Start conversation error:', error)
        res.status(500).json({
            success: false,
            message: 'Failed to start conversation'
        })
    }
}
