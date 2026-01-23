/**
 * Seed script to populate MongoDB with demo jobs for all Tamil Nadu districts
 * Run with: node src/scripts/seedJobs.js
 */

require('dotenv').config()
const mongoose = require('mongoose')
const Job = require('../models/Job')
const User = require('../models/User')

// Tamil Nadu Districts with coordinates
const DISTRICTS = [
    { name: 'Ariyalur', coords: [79.0764, 11.1428] },
    { name: 'Chengalpattu', coords: [79.9767, 12.6819] },
    { name: 'Chennai', coords: [80.2707, 13.0827] },
    { name: 'Coimbatore', coords: [76.9558, 11.0168] },
    { name: 'Cuddalore', coords: [79.7714, 11.7480] },
    { name: 'Dharmapuri', coords: [78.1582, 12.1357] },
    { name: 'Dindigul', coords: [77.9695, 10.3673] },
    { name: 'Erode', coords: [77.7172, 11.3410] },
    { name: 'Kallakurichi', coords: [78.9604, 11.7408] },
    { name: 'Kancheepuram', coords: [79.7036, 12.8342] },
    { name: 'Kanniyakumari', coords: [77.5385, 8.0883] },
    { name: 'Karur', coords: [78.0766, 10.9601] },
    { name: 'Krishnagiri', coords: [78.2139, 12.5186] },
    { name: 'Madurai', coords: [78.1198, 9.9252] },
    { name: 'Mayiladuthurai', coords: [79.6556, 11.1018] },
    { name: 'Nagapattinam', coords: [79.8449, 10.7672] },
    { name: 'Namakkal', coords: [78.1657, 11.2189] },
    { name: 'Nilgiris', coords: [76.6950, 11.4064] },
    { name: 'Perambalur', coords: [78.8800, 11.2340] },
    { name: 'Pudukkottai', coords: [78.8001, 10.3833] },
    { name: 'Ramanathapuram', coords: [78.8308, 9.3716] },
    { name: 'Ranipet', coords: [79.3333, 12.9300] },
    { name: 'Salem', coords: [78.1460, 11.6643] },
    { name: 'Sivagangai', coords: [78.4836, 9.8433] },
    { name: 'Tenkasi', coords: [77.3152, 8.9604] },
    { name: 'Thanjavur', coords: [79.1378, 10.7870] },
    { name: 'Theni', coords: [77.4767, 10.0104] },
    { name: 'Thoothukudi', coords: [78.1348, 8.7642] },
    { name: 'Tiruchirappalli', coords: [78.7047, 10.7905] },
    { name: 'Tirunelveli', coords: [77.7567, 8.7139] },
    { name: 'Tirupathur', coords: [78.5730, 12.4960] },
    { name: 'Tiruppur', coords: [77.3411, 11.1085] },
    { name: 'Tiruvallur', coords: [79.9120, 13.1231] },
    { name: 'Tiruvannamalai', coords: [79.0747, 12.2253] },
    { name: 'Tiruvarur', coords: [79.6341, 10.7725] },
    { name: 'Vellore', coords: [79.1325, 12.9165] },
    { name: 'Viluppuram', coords: [79.4928, 11.9401] },
    { name: 'Virudhunagar', coords: [77.9624, 9.5680] }
]

// Job templates with categories
const JOB_TEMPLATES = [
    // Construction
    { category: 'construction', titleEn: 'Construction Helper', titleTa: 'கட்டுமான உதவியாளர்', descEn: 'Construction helper needed for building project.', descTa: 'கட்டிட திட்டத்திற்கு கட்டுமான உதவியாளர் தேவை.', wageRange: [600, 900] },
    { category: 'construction', titleEn: 'Mason Required', titleTa: 'கொத்தனார் தேவை', descEn: 'Experienced mason needed for brick work.', descTa: 'செங்கல் வேலைக்கு அனுபவமுள்ள கொத்தனார் தேவை.', wageRange: [800, 1200] },

    // Plumbing
    { category: 'plumbing', titleEn: 'Plumber Required', titleTa: 'குழாய் பணியாளர் தேவை', descEn: 'Plumber needed for water pipe work.', descTa: 'தண்ணீர் குழாய் வேலைக்கு குழாய் பணியாளர் தேவை.', wageRange: [700, 1000] },
    { category: 'plumbing', titleEn: 'Bathroom Fitting Work', titleTa: 'குளியலறை பொருத்தும் வேலை', descEn: 'Plumber needed for bathroom fitting installation.', descTa: 'குளியலறை பொருத்துதல் நிறுவலுக்கு தொழிலாளி தேவை.', wageRange: [800, 1200] },

    // Electrical
    { category: 'electrical', titleEn: 'Electrician Needed', titleTa: 'மின்சாரி தேவை', descEn: 'Electrician required for house wiring.', descTa: 'வீட்டு வயரிங்கிற்கு மின்சாரி தேவை.', wageRange: [700, 1100] },
    { category: 'electrical', titleEn: 'Fan & Light Installation', titleTa: 'விசிறி & விளக்கு நிறுவல்', descEn: 'Electrician needed for fan and light installation.', descTa: 'விசிறி மற்றும் விளக்கு நிறுவலுக்கு மின்சாரி தேவை.', wageRange: [500, 800] },

    // Painting
    { category: 'painting', titleEn: 'House Painter Required', titleTa: 'வீடு வண்ணம் பூசுபவர் தேவை', descEn: 'Painter needed for house painting work.', descTa: 'வீடு வண்ணம் பூசும் வேலைக்கு பெயின்டர் தேவை.', wageRange: [700, 1000] },
    { category: 'painting', titleEn: 'Wall Painting Work', titleTa: 'சுவர் வண்ணம் பூசும் வேலை', descEn: 'Painter required for interior wall painting.', descTa: 'உள்புற சுவர் வண்ணம் பூசுவதற்கு பெயின்டர் தேவை.', wageRange: [600, 900] },

    // Carpentry
    { category: 'carpentry', titleEn: 'Carpenter Required', titleTa: 'தச்சர் தேவை', descEn: 'Carpenter needed for furniture work.', descTa: 'தளபாட வேலைக்கு தச்சர் தேவை.', wageRange: [700, 1100] },
    { category: 'carpentry', titleEn: 'Door & Window Repair', titleTa: 'கதவு & ஜன்னல் பழுதுபார்ப்பு', descEn: 'Carpenter needed for door and window repair.', descTa: 'கதவு மற்றும் ஜன்னல் பழுதுபார்க்க தச்சர் தேவை.', wageRange: [600, 900] },

    // Cleaning
    { category: 'cleaning', titleEn: 'House Cleaning', titleTa: 'வீடு சுத்தம் செய்தல்', descEn: 'Cleaner needed for daily house cleaning.', descTa: 'தினசரி வீடு சுத்தம் செய்ய ஆள் தேவை.', wageRange: [350, 500] },
    { category: 'cleaning', titleEn: 'Deep Cleaning Service', titleTa: 'ஆழமான சுத்தம் சேவை', descEn: 'Deep cleaning staff needed for apartment.', descTa: 'அபார்ட்மெண்டுக்கு ஆழமான சுத்தம் செய்ய ஊழியர் தேவை.', wageRange: [500, 700] },

    // Cooking
    { category: 'cooking', titleEn: 'Cook for Home', titleTa: 'வீட்டிற்கு சமையல்காரர்', descEn: 'Cook needed for daily cooking.', descTa: 'தினசரி சமையலுக்கு சமையல்காரர் தேவை.', wageRange: [400, 600] },
    { category: 'cooking', titleEn: 'Event Catering Cook', titleTa: 'நிகழ்ச்சி உணவு சமையல்காரர்', descEn: 'Experienced cook needed for event catering.', descTa: 'நிகழ்ச்சி உணவு வழங்கலுக்கு அனுபவமுள்ள சமையல்காரர் தேவை.', wageRange: [1000, 2000] },

    // Security
    { category: 'security', titleEn: 'Security Guard', titleTa: 'பாதுகாப்பு காவலர்', descEn: 'Security guard needed for building.', descTa: 'கட்டிடத்திற்கு பாதுகாப்பு காவலர் தேவை.', wageRange: [500, 700] },
    { category: 'security', titleEn: 'Night Watchman', titleTa: 'இரவு காவலாளி', descEn: 'Night security guard required.', descTa: 'இரவு பாதுகாப்பு காவலர் தேவை.', wageRange: [550, 750] },

    // Driving
    { category: 'driving', titleEn: 'Driver Required', titleTa: 'டிரைவர் தேவை', descEn: 'Driver needed for family.', descTa: 'குடும்பத்திற்கு டிரைவர் தேவை.', wageRange: [600, 900] },
    { category: 'driving', titleEn: 'Delivery Driver', titleTa: 'டெலிவரி டிரைவர்', descEn: 'Delivery driver with own vehicle needed.', descTa: 'சொந்த வாகனத்துடன் டெலிவரி டிரைவர் தேவை.', wageRange: [500, 800] },

    // Farming
    { category: 'farming', titleEn: 'Farm Worker', titleTa: 'பண்ணை தொழிலாளர்', descEn: 'Farm worker needed for agricultural work.', descTa: 'விவசாய வேலைக்கு பண்ணை தொழிலாளர் தேவை.', wageRange: [450, 650] },
    { category: 'farming', titleEn: 'Paddy Field Helper', titleTa: 'நெல் வயல் உதவியாளர்', descEn: 'Helper needed for paddy field work.', descTa: 'நெல் வயல் வேலைக்கு உதவியாளர் தேவை.', wageRange: [400, 600] },

    // Gardening
    { category: 'gardening', titleEn: 'Gardener Required', titleTa: 'தோட்டக்காரர் தேவை', descEn: 'Gardener needed for garden maintenance.', descTa: 'தோட்ட பராமரிப்புக்கு தோட்டக்காரர் தேவை.', wageRange: [400, 600] },

    // Delivery
    { category: 'delivery', titleEn: 'Delivery Executive', titleTa: 'டெலிவரி நிர்வாகி', descEn: 'Delivery person needed with own bike.', descTa: 'சொந்த பைக்குடன் டெலிவரி நபர் தேவை.', wageRange: [500, 750] },

    // Factory
    { category: 'factory-worker', titleEn: 'Factory Worker', titleTa: 'தொழிற்சாலை தொழிலாளர்', descEn: 'Workers needed for factory production.', descTa: 'தொழிற்சாலை உற்பத்திக்கு தொழிலாளர்கள் தேவை.', wageRange: [500, 700] },

    // AC Repair
    { category: 'ac-repair', titleEn: 'AC Technician', titleTa: 'ஏசி தொழில்நுட்ப வல்லுநர்', descEn: 'AC technician needed for service and repair.', descTa: 'சர்வீஸ் மற்றும் பழுதுபார்ப்புக்கு ஏசி தொழில்நுட்ப வல்லுநர் தேவை.', wageRange: [800, 1500] }
]

const DURATIONS = ['1 day', '2 days', '3 days', '1 week', '2 weeks', 'Monthly', 'Daily']
const EMPLOYERS = [
    'Local Home Owner', 'Building Contractor', 'Shop Owner', 'Factory Ltd',
    'Family', 'Temple Trust', 'School', 'Hospital', 'Restaurant',
    'Transport Company', 'Construction Co', 'Real Estate', 'Hotel'
]

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min
}

function getRandomElement(arr) {
    return arr[Math.floor(Math.random() * arr.length)]
}

async function seedJobs() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI)
        console.log('✅ Connected to MongoDB')

        // Find or create a demo employer
        let employer = await User.findOne({ role: 'employer' })
        if (!employer) {
            employer = await User.create({
                name: 'Demo Employer',
                email: 'employer@demo.com',
                phone: '9999999999',
                password: 'demo123',
                role: 'employer',
                location: 'Chennai',
                profileCompleted: true,
                phoneVerified: true
            })
            console.log('✅ Created demo employer')
        }

        // Delete existing demo jobs (optional - comment out to keep adding)
        // await Job.deleteMany({})
        // console.log('🗑️ Cleared existing jobs')

        let totalCreated = 0
        const jobs = []

        // Generate 10+ jobs per district
        for (const district of DISTRICTS) {
            const jobCount = getRandomInt(10, 15) // 10-15 jobs per district

            for (let i = 0; i < jobCount; i++) {
                const template = getRandomElement(JOB_TEMPLATES)
                const wage = getRandomInt(template.wageRange[0], template.wageRange[1])
                const isUrgent = Math.random() < 0.2 // 20% urgent

                // Slight variation in coordinates for each job within district
                const coordVariation = () => (Math.random() - 0.5) * 0.1
                const coords = [
                    district.coords[0] + coordVariation(),
                    district.coords[1] + coordVariation()
                ]

                const job = {
                    title: {
                        en: template.titleEn,
                        ta: template.titleTa
                    },
                    description: {
                        en: `${template.descEn} Location: ${district.name}. Contact for more details.`,
                        ta: `${template.descTa} இடம்: ${district.name}. மேலும் விவரங்களுக்கு தொடர்பு கொள்ளவும்.`
                    },
                    category: template.category,
                    employer: employer._id,
                    location: district.name,
                    geoLocation: {
                        type: 'Point',
                        coordinates: coords
                    },
                    wage: wage,
                    wageType: 'daily',
                    duration: getRandomElement(DURATIONS),
                    status: 'open',
                    urgent: isUrgent,
                    requiredWorkers: getRandomInt(1, 3),
                    skills: [],
                    createdAt: new Date(Date.now() - getRandomInt(0, 7) * 24 * 60 * 60 * 1000) // Random date within last week
                }

                jobs.push(job)
            }

            console.log(`📍 Generated ${jobCount} jobs for ${district.name}`)
        }

        // Bulk insert for efficiency
        const result = await Job.insertMany(jobs)
        totalCreated = result.length

        console.log(`\n✅ Successfully seeded ${totalCreated} jobs across ${DISTRICTS.length} districts!`)
        console.log(`📊 Average: ${Math.round(totalCreated / DISTRICTS.length)} jobs per district`)

        // Verify count
        const totalJobs = await Job.countDocuments({ status: 'open' })
        console.log(`📈 Total open jobs in database: ${totalJobs}`)

    } catch (error) {
        console.error('❌ Seeding error:', error)
    } finally {
        await mongoose.disconnect()
        console.log('🔌 Disconnected from MongoDB')
    }
}

// Run the seed
seedJobs()
