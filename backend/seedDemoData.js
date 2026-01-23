// Seed demo applications and messages for testing
const mongoose = require('mongoose')
const { ObjectId } = mongoose.Types

async function seedDemoData() {
    try {
        await mongoose.connect('mongodb://localhost:27017/daycraft')
        console.log('✅ Connected to MongoDB')

        const db = mongoose.connection.db

        // Get some workers and employers
        const workers = await db.collection('users').find({ role: 'worker' }).limit(10).toArray()
        const employers = await db.collection('users').find({ role: 'employer' }).limit(5).toArray()
        const jobs = await db.collection('jobs').find({}).limit(10).toArray()

        if (workers.length === 0 || employers.length === 0 || jobs.length === 0) {
            console.log('❌ Not enough data to seed. Need workers, employers, and jobs.')
            process.exit(1)
        }

        console.log(`Found ${workers.length} workers, ${employers.length} employers, ${jobs.length} jobs`)

        // 1. Seed Applications (job applications)
        const applications = []
        for (let i = 0; i < 15; i++) {
            const worker = workers[i % workers.length]
            const job = jobs[i % jobs.length]
            applications.push({
                _id: new ObjectId(),
                jobId: job._id,
                workerId: worker._id,
                employerId: job.employer || employers[0]._id,
                status: ['pending', 'accepted', 'rejected', 'completed'][Math.floor(Math.random() * 4)],
                appliedAt: new Date(Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000)),
                message: `I am interested in this ${job.title || 'job'} position.`,
                workerLocation: worker.location || 'Local Area',
                createdAt: new Date(),
                updatedAt: new Date()
            })
        }
        await db.collection('applications').deleteMany({})
        await db.collection('applications').insertMany(applications)
        console.log(`✅ Added ${applications.length} applications`)

        // 2. Seed Conversations
        const conversations = []
        for (let i = 0; i < 5; i++) {
            const worker = workers[i]
            const employer = employers[i % employers.length]
            conversations.push({
                _id: new ObjectId(),
                participants: [worker._id, employer._id],
                lastMessage: 'Hello, I am available for work.',
                lastMessageAt: new Date(),
                createdAt: new Date(),
                updatedAt: new Date()
            })
        }
        await db.collection('conversations').deleteMany({})
        await db.collection('conversations').insertMany(conversations)
        console.log(`✅ Added ${conversations.length} conversations`)

        // 3. Seed Messages
        const messages = []
        for (let i = 0; i < conversations.length; i++) {
            const conv = conversations[i]
            const msgTexts = [
                'Hello, I saw your profile.',
                'Hi! Yes, I am available for work.',
                'Great! Can you start tomorrow?',
                'Yes, I can. What time should I come?',
                'Please come at 9 AM. Address: 123 Main Street.'
            ]
            for (let j = 0; j < msgTexts.length; j++) {
                messages.push({
                    conversationId: conv._id,
                    senderId: conv.participants[j % 2],
                    receiverId: conv.participants[(j + 1) % 2],
                    content: msgTexts[j],
                    read: j < 3,
                    createdAt: new Date(Date.now() - (msgTexts.length - j) * 60 * 60 * 1000),
                    updatedAt: new Date()
                })
            }
        }
        await db.collection('messages').deleteMany({})
        await db.collection('messages').insertMany(messages)
        console.log(`✅ Added ${messages.length} messages`)

        // 4. Seed Contacts (worker requests from modal)
        const contacts = []
        for (let i = 0; i < 8; i++) {
            const worker = workers[i]
            const employer = employers[i % employers.length]
            contacts.push({
                workerId: worker._id,
                employerId: employer._id,
                status: ['pending', 'accepted', 'declined'][Math.floor(Math.random() * 3)],
                requestedAt: new Date(Date.now() - Math.floor(Math.random() * 5 * 24 * 60 * 60 * 1000)),
                message: 'I would like to hire you for a project.',
                createdAt: new Date(),
                updatedAt: new Date()
            })
        }
        await db.collection('contacts').deleteMany({})
        await db.collection('contacts').insertMany(contacts)
        console.log(`✅ Added ${contacts.length} contacts`)

        // 5. Seed Reports (for admin dashboard)
        const reports = [
            { type: 'daily', date: new Date(), totalJobs: jobs.length, totalWorkers: workers.length, totalApplications: 15, createdAt: new Date() },
            { type: 'weekly', weekStart: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), totalJobs: jobs.length + 5, totalWorkers: workers.length, newUsers: 12, createdAt: new Date() }
        ]
        await db.collection('reports').deleteMany({})
        await db.collection('reports').insertMany(reports)
        console.log(`✅ Added ${reports.length} reports`)

        console.log('\n🎉 All demo data seeded successfully!')
        console.log('Refresh MongoDB Compass to see the data.')

        await mongoose.disconnect()
        process.exit(0)
    } catch (error) {
        console.error('❌ Error:', error.message)
        process.exit(1)
    }
}

seedDemoData()
