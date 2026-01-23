const mongoose = require('mongoose')
const dotenv = require('dotenv')
const path = require('path')

dotenv.config({ path: path.join(__dirname, '.env') })

async function checkUsers() {
    try {
        await mongoose.connect(process.env.MONGODB_URI)
        console.log('Connected to MongoDB')

        const User = require('./src/models/User')
        const users = await User.find({}, 'name email phone role createdAt').sort({ createdAt: -1 }).limit(10)

        console.log('\n===== Users in MongoDB =====')
        users.forEach((u, i) => {
            console.log(`${i + 1}. ${u.name} | ${u.email} | ${u.phone} | ${u.role}`)
        })
        console.log(`\nTotal users found: ${users.length}`)

        await mongoose.disconnect()
    } catch (error) {
        console.error('Error:', error.message)
        process.exit(1)
    }
}

checkUsers()
