const mongoose = require('mongoose')
const dotenv = require('dotenv')
const path = require('path')

dotenv.config({ path: path.join(__dirname, '.env') })

async function seedGeoData() {
    try {
        await mongoose.connect(process.env.MONGODB_URI)
        console.log('Connected to MongoDB')

        const Job = require('./src/models/Job')
        const User = require('./src/models/User')

        // Chennai Center
        const centerLat = 13.0827
        const centerLng = 80.2707

        // Helper to get random coord within approx 20km
        const getRandomCoord = (base, range = 0.15) => base + (Math.random() - 0.5) * range

        // Update Users
        const users = await User.find({})
        console.log(`Updating ${users.length} users with coordinates...`)
        for (const user of users) {
            user.geoLocation = {
                type: 'Point',
                coordinates: [getRandomCoord(centerLng), getRandomCoord(centerLat)]
            }
            // Fix location if it's an object (pre-existing data issue)
            if (typeof user.location === 'object' && user.location !== null) {
                user.location = user.location.city || user.location.name || 'Chennai'
            }
            await user.save({ validateBeforeSave: false })
        }

        // Update Jobs
        const jobs = await Job.find({})
        console.log(`Updating ${jobs.length} jobs with coordinates...`)
        for (const job of jobs) {
            job.geoLocation = {
                type: 'Point',
                coordinates: [getRandomCoord(centerLng), getRandomCoord(centerLat)]
            }
            // Fix location if it's an object
            if (typeof job.location === 'object' && job.location !== null) {
                job.location = job.location.city || job.location.name || 'Chennai'
            }
            await job.save({ validateBeforeSave: false })
        }

        console.log('Successfully seeded geo-location data!')
        await mongoose.disconnect()
    } catch (error) {
        console.error('Error:', error.message)
        process.exit(1)
    }
}

seedGeoData()
