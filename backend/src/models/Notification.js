const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    type: {
        type: String,
        enum: ['job_match', 'work_request', 'application_received', 'request_accepted', 'system'],
        required: true
    },
    title: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    data: {
        jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job' },
        applicationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Application' },
        senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
    },
    isRead: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 2592000 // Automatically delete after 30 days (60*60*24*30)
    }
});

module.exports = mongoose.model('Notification', notificationSchema);
