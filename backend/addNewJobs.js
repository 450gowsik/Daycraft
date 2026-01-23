const mongoose = require('mongoose')
require('dotenv').config({ path: '.env' })

const Job = require('./src/models/Job')
const User = require('./src/models/User')

const newJobs = [
    {
        title: { en: 'Delivery Driver', ta: 'டெலிவரி டிரைவர்' },
        description: { en: 'Need experienced delivery driver for local package delivery. Must have valid license and own two-wheeler.', ta: 'உள்ளூர் பேக்கேஜ் டெலிவரிக்கு அனுபவமுள்ள டெலிவரி டிரைவர் தேவை.' },
        category: 'driving',
        wage: 650,
        location: 'Chennai, Nungambakkam',
        duration: 'Daily',
        status: 'open',
        urgent: true
    },
    {
        title: { en: 'AC Technician', ta: 'ஏசி தொழில்நுட்ப வல்லுநர்' },
        description: { en: 'Experienced AC technician needed for installation and servicing of split AC units.', ta: 'ஸ்பிளிட் ஏசி யூனிட்களை நிறுவுதல் மற்றும் சர்வீசிங் செய்ய அனுபவமுள்ள ஏசி தொழில்நுட்ப வல்லுநர் தேவை.' },
        category: 'electrical',
        wage: 1800,
        location: 'Chennai, T Nagar',
        duration: '2 days',
        status: 'open',
        urgent: false
    },
    {
        title: { en: 'Event Helper', ta: 'நிகழ்வு உதவியாளர்' },
        description: { en: 'Helpers needed for wedding event setup and decoration. No experience required.', ta: 'திருமண நிகழ்வு அமைப்பு மற்றும் அலங்காரத்திற்கு உதவியாளர்கள் தேவை.' },
        category: 'other',
        wage: 450,
        location: 'Chennai, Adyar',
        duration: '1 day',
        status: 'open',
        urgent: true
    }
]

async function addJobs() {
    try {
        await mongoose.connect(process.env.MONGODB_URI)
        console.log('Connected to MongoDB')

        const employer = await User.findOne({ role: 'employer' })
        const jobsWithEmployer = newJobs.map(job => ({ ...job, employer: employer._id }))

        await Job.insertMany(jobsWithEmployer)
        console.log('Added 3 new jobs!')

        const count = await Job.countDocuments()
        console.log('Total jobs:', count)

        await mongoose.disconnect()
    } catch (err) {
        console.error(err)
    }
}

addJobs()
