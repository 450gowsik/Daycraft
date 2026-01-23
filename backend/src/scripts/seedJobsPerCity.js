/**
 * Seed script to populate MongoDB with 10 jobs per CITY in Tamil Nadu
 * Run with: node src/scripts/seedJobsPerCity.js
 */

require('dotenv').config()
const mongoose = require('mongoose')
const Job = require('../models/Job')
const User = require('../models/User')

// Tamil Nadu Districts and Cities with coordinates
const LOCATIONS = [
    // Ariyalur District
    { city: 'Ariyalur', district: 'Ariyalur', coords: [79.0764, 11.1428] },
    { city: 'Jayankondam', district: 'Ariyalur', coords: [79.1356, 11.2100] },
    { city: 'Sendurai', district: 'Ariyalur', coords: [79.0900, 11.1800] },
    { city: 'Udayarpalayam', district: 'Ariyalur', coords: [79.0600, 11.0800] },

    // Chengalpattu District
    { city: 'Chengalpattu', district: 'Chengalpattu', coords: [79.9767, 12.6819] },
    { city: 'Mahabalipuram', district: 'Chengalpattu', coords: [80.1927, 12.6269] },
    { city: 'Tambaram', district: 'Chengalpattu', coords: [80.1278, 12.9249] },
    { city: 'Kelambakkam', district: 'Chengalpattu', coords: [80.2183, 12.7856] },
    { city: 'Guduvancheri', district: 'Chengalpattu', coords: [80.0611, 12.8450] },

    // Chennai District
    { city: 'T. Nagar', district: 'Chennai', coords: [80.2341, 13.0418] },
    { city: 'Anna Nagar', district: 'Chennai', coords: [80.2095, 13.0850] },
    { city: 'Velachery', district: 'Chennai', coords: [80.2214, 12.9815] },
    { city: 'Adyar', district: 'Chennai', coords: [80.2574, 13.0067] },
    { city: 'Mylapore', district: 'Chennai', coords: [80.2676, 13.0339] },
    { city: 'Guindy', district: 'Chennai', coords: [80.2130, 13.0067] },
    { city: 'Porur', district: 'Chennai', coords: [80.1565, 13.0382] },
    { city: 'Ambattur', district: 'Chennai', coords: [80.1620, 13.0982] },
    { city: 'Kodambakkam', district: 'Chennai', coords: [80.2247, 13.0524] },
    { city: 'Thiruvanmiyur', district: 'Chennai', coords: [80.2600, 12.9830] },

    // Coimbatore District
    { city: 'Gandhipuram', district: 'Coimbatore', coords: [76.9558, 11.0168] },
    { city: 'Peelamedu', district: 'Coimbatore', coords: [77.0023, 11.0254] },
    { city: 'Singanallur', district: 'Coimbatore', coords: [77.0299, 11.0067] },
    { city: 'Saibaba Colony', district: 'Coimbatore', coords: [76.9700, 11.0420] },
    { city: 'RS Puram', district: 'Coimbatore', coords: [76.9478, 11.0108] },
    { city: 'Pollachi', district: 'Coimbatore', coords: [77.0123, 10.6609] },
    { city: 'Mettupalayam', district: 'Coimbatore', coords: [76.9388, 11.2994] },

    // Cuddalore District
    { city: 'Cuddalore', district: 'Cuddalore', coords: [79.7714, 11.7480] },
    { city: 'Chidambaram', district: 'Cuddalore', coords: [79.6918, 11.3992] },
    { city: 'Virudhachalam', district: 'Cuddalore', coords: [79.3192, 11.5249] },
    { city: 'Neyveli', district: 'Cuddalore', coords: [79.4769, 11.5475] },

    // Dharmapuri District
    { city: 'Dharmapuri', district: 'Dharmapuri', coords: [78.1582, 12.1357] },
    { city: 'Palacode', district: 'Dharmapuri', coords: [78.0667, 12.2167] },
    { city: 'Pennagaram', district: 'Dharmapuri', coords: [77.8925, 12.1325] },

    // Dindigul District
    { city: 'Dindigul', district: 'Dindigul', coords: [77.9695, 10.3673] },
    { city: 'Palani', district: 'Dindigul', coords: [77.5200, 10.4500] },
    { city: 'Oddanchatram', district: 'Dindigul', coords: [77.7511, 10.4869] },
    { city: 'Kodaikanal', district: 'Dindigul', coords: [77.4892, 10.2381] },

    // Erode District
    { city: 'Erode', district: 'Erode', coords: [77.7172, 11.3410] },
    { city: 'Bhavani', district: 'Erode', coords: [77.6828, 11.4500] },
    { city: 'Gobichettipalayam', district: 'Erode', coords: [77.4333, 11.4525] },
    { city: 'Sathyamangalam', district: 'Erode', coords: [77.2389, 11.5050] },

    // Kallakurichi District
    { city: 'Kallakurichi', district: 'Kallakurichi', coords: [78.9604, 11.7408] },
    { city: 'Ulundurpet', district: 'Kallakurichi', coords: [79.3282, 11.7571] },
    { city: 'Chinnasalem', district: 'Kallakurichi', coords: [78.8771, 11.6330] },

    // Kancheepuram District
    { city: 'Kancheepuram', district: 'Kancheepuram', coords: [79.7036, 12.8342] },
    { city: 'Sriperumbudur', district: 'Kancheepuram', coords: [79.9427, 12.9692] },
    { city: 'Uthiramerur', district: 'Kancheepuram', coords: [79.7550, 12.6150] },

    // Kanniyakumari District
    { city: 'Nagercoil', district: 'Kanniyakumari', coords: [77.4310, 8.1833] },
    { city: 'Marthandam', district: 'Kanniyakumari', coords: [77.2167, 8.3000] },
    { city: 'Colachel', district: 'Kanniyakumari', coords: [77.2503, 8.1750] },
    { city: 'Kanniyakumari', district: 'Kanniyakumari', coords: [77.5385, 8.0883] },

    // Karur District
    { city: 'Karur', district: 'Karur', coords: [78.0766, 10.9601] },
    { city: 'Kulithalai', district: 'Karur', coords: [78.4167, 10.9333] },
    { city: 'Aravakurichi', district: 'Karur', coords: [78.0900, 10.7900] },

    // Krishnagiri District
    { city: 'Krishnagiri', district: 'Krishnagiri', coords: [78.2139, 12.5186] },
    { city: 'Hosur', district: 'Krishnagiri', coords: [77.8253, 12.7409] },
    { city: 'Denkanikottai', district: 'Krishnagiri', coords: [77.7833, 12.5333] },

    // Madurai District
    { city: 'Madurai North', district: 'Madurai', coords: [78.1198, 9.9352] },
    { city: 'Madurai South', district: 'Madurai', coords: [78.1198, 9.9152] },
    { city: 'Thiruparankundram', district: 'Madurai', coords: [78.0667, 9.8667] },
    { city: 'Melur', district: 'Madurai', coords: [78.3389, 10.0317] },
    { city: 'Usilampatti', district: 'Madurai', coords: [77.7900, 9.9700] },

    // Mayiladuthurai District
    { city: 'Mayiladuthurai', district: 'Mayiladuthurai', coords: [79.6556, 11.1018] },
    { city: 'Sirkazhi', district: 'Mayiladuthurai', coords: [79.7367, 11.2386] },
    { city: 'Kuthalam', district: 'Mayiladuthurai', coords: [79.5333, 11.1167] },

    // Nagapattinam District
    { city: 'Nagapattinam', district: 'Nagapattinam', coords: [79.8449, 10.7672] },
    { city: 'Velankanni', district: 'Nagapattinam', coords: [79.8500, 10.6833] },
    { city: 'Thirukkuvalai', district: 'Nagapattinam', coords: [79.5067, 10.6700] },

    // Namakkal District
    { city: 'Namakkal', district: 'Namakkal', coords: [78.1657, 11.2189] },
    { city: 'Rasipuram', district: 'Namakkal', coords: [78.1850, 11.4623] },
    { city: 'Tiruchengode', district: 'Namakkal', coords: [77.8939, 11.3811] },
    { city: 'Paramathi', district: 'Namakkal', coords: [78.0500, 11.1833] },

    // Nilgiris District
    { city: 'Ooty', district: 'Nilgiris', coords: [76.6950, 11.4064] },
    { city: 'Coonoor', district: 'Nilgiris', coords: [76.7956, 11.3530] },
    { city: 'Kotagiri', district: 'Nilgiris', coords: [76.8619, 11.4222] },
    { city: 'Gudalur', district: 'Nilgiris', coords: [76.4983, 11.5028] },

    // Perambalur District
    { city: 'Perambalur', district: 'Perambalur', coords: [78.8800, 11.2340] },
    { city: 'Kunnam', district: 'Perambalur', coords: [78.8200, 11.2800] },
    { city: 'Veppanthattai', district: 'Perambalur', coords: [78.8400, 11.3100] },

    // Pudukkottai District
    { city: 'Pudukkottai', district: 'Pudukkottai', coords: [78.8001, 10.3833] },
    { city: 'Aranthangi', district: 'Pudukkottai', coords: [79.0067, 10.1700] },
    { city: 'Alangudi', district: 'Pudukkottai', coords: [78.9833, 10.3667] },

    // Ramanathapuram District
    { city: 'Ramanathapuram', district: 'Ramanathapuram', coords: [78.8308, 9.3716] },
    { city: 'Paramakudi', district: 'Ramanathapuram', coords: [78.5906, 9.5467] },
    { city: 'Rameswaram', district: 'Ramanathapuram', coords: [79.3129, 9.2876] },

    // Ranipet District
    { city: 'Ranipet', district: 'Ranipet', coords: [79.3333, 12.9300] },
    { city: 'Arcot', district: 'Ranipet', coords: [79.3500, 12.9000] },
    { city: 'Walajapet', district: 'Ranipet', coords: [79.3667, 12.9333] },
    { city: 'Arakkonam', district: 'Ranipet', coords: [79.6700, 13.0800] },

    // Salem District
    { city: 'Salem', district: 'Salem', coords: [78.1460, 11.6643] },
    { city: 'Attur', district: 'Salem', coords: [78.6008, 11.5975] },
    { city: 'Mettur', district: 'Salem', coords: [77.8028, 11.7883] },
    { city: 'Omalur', district: 'Salem', coords: [78.0467, 11.7417] },

    // Sivagangai District
    { city: 'Sivagangai', district: 'Sivagangai', coords: [78.4836, 9.8433] },
    { city: 'Karaikudi', district: 'Sivagangai', coords: [78.7675, 10.0762] },
    { city: 'Devakottai', district: 'Sivagangai', coords: [78.8261, 9.9481] },

    // Tenkasi District
    { city: 'Tenkasi', district: 'Tenkasi', coords: [77.3152, 8.9604] },
    { city: 'Sankarankovil', district: 'Tenkasi', coords: [77.5333, 9.1833] },
    { city: 'Kadayanallur', district: 'Tenkasi', coords: [77.3389, 9.0683] },

    // Thanjavur District
    { city: 'Thanjavur', district: 'Thanjavur', coords: [79.1378, 10.7870] },
    { city: 'Kumbakonam', district: 'Thanjavur', coords: [79.3881, 10.9602] },
    { city: 'Pattukkottai', district: 'Thanjavur', coords: [79.3167, 10.4167] },
    { city: 'Papanasam', district: 'Thanjavur', coords: [79.2667, 10.9333] },

    // Theni District
    { city: 'Theni', district: 'Theni', coords: [77.4767, 10.0104] },
    { city: 'Periyakulam', district: 'Theni', coords: [77.5422, 10.1239] },
    { city: 'Bodinayakanur', district: 'Theni', coords: [77.3500, 10.0167] },
    { city: 'Andipatti', district: 'Theni', coords: [77.6167, 9.9833] },

    // Thoothukudi District
    { city: 'Thoothukudi', district: 'Thoothukudi', coords: [78.1348, 8.7642] },
    { city: 'Kovilpatti', district: 'Thoothukudi', coords: [77.8667, 9.1736] },
    { city: 'Tiruchendur', district: 'Thoothukudi', coords: [78.1189, 8.4956] },
    { city: 'Ettayapuram', district: 'Thoothukudi', coords: [78.0000, 9.1500] },

    // Tiruchirappalli District
    { city: 'Tiruchirappalli', district: 'Tiruchirappalli', coords: [78.7047, 10.7905] },
    { city: 'Srirangam', district: 'Tiruchirappalli', coords: [78.6925, 10.8619] },
    { city: 'Lalgudi', district: 'Tiruchirappalli', coords: [78.8167, 10.8667] },
    { city: 'Musiri', district: 'Tiruchirappalli', coords: [78.4431, 10.9539] },

    // Tirunelveli District
    { city: 'Tirunelveli', district: 'Tirunelveli', coords: [77.7567, 8.7139] },
    { city: 'Palayamkottai', district: 'Tirunelveli', coords: [77.7333, 8.7333] },
    { city: 'Ambasamudram', district: 'Tirunelveli', coords: [77.4503, 8.7117] },
    { city: 'Nanguneri', district: 'Tirunelveli', coords: [77.6500, 8.5000] },

    // Tirupathur District
    { city: 'Tirupathur', district: 'Tirupathur', coords: [78.5730, 12.4960] },
    { city: 'Vaniyambadi', district: 'Tirupathur', coords: [78.6200, 12.6833] },
    { city: 'Ambur', district: 'Tirupathur', coords: [78.7167, 12.7833] },

    // Tiruppur District
    { city: 'Tiruppur', district: 'Tiruppur', coords: [77.3411, 11.1085] },
    { city: 'Avinashi', district: 'Tiruppur', coords: [77.2669, 11.1914] },
    { city: 'Palladam', district: 'Tiruppur', coords: [77.2858, 10.9917] },
    { city: 'Udumalpet', district: 'Tiruppur', coords: [77.2489, 10.5886] },

    // Tiruvallur District
    { city: 'Tiruvallur', district: 'Tiruvallur', coords: [79.9120, 13.1231] },
    { city: 'Avadi', district: 'Tiruvallur', coords: [80.0969, 13.1145] },
    { city: 'Poonamallee', district: 'Tiruvallur', coords: [80.0979, 13.0463] },
    { city: 'Ennore', district: 'Tiruvallur', coords: [80.2361, 13.2217] },

    // Tiruvannamalai District
    { city: 'Tiruvannamalai', district: 'Tiruvannamalai', coords: [79.0747, 12.2253] },
    { city: 'Arani', district: 'Tiruvannamalai', coords: [79.2833, 12.6667] },
    { city: 'Polur', district: 'Tiruvannamalai', coords: [79.1167, 12.5167] },
    { city: 'Cheyyar', district: 'Tiruvannamalai', coords: [79.5439, 12.6631] },

    // Tiruvarur District
    { city: 'Tiruvarur', district: 'Tiruvarur', coords: [79.6341, 10.7725] },
    { city: 'Mannargudi', district: 'Tiruvarur', coords: [79.4514, 10.6669] },
    { city: 'Thiruthuraipoondi', district: 'Tiruvarur', coords: [79.6333, 10.5333] },
    { city: 'Nannilam', district: 'Tiruvarur', coords: [79.6167, 10.8667] },

    // Vellore District
    { city: 'Vellore', district: 'Vellore', coords: [79.1325, 12.9165] },
    { city: 'Katpadi', district: 'Vellore', coords: [79.1372, 12.9608] },
    { city: 'Gudiyatham', district: 'Vellore', coords: [78.8750, 12.9500] },
    { city: 'Vaniyambadi', district: 'Vellore', coords: [78.6200, 12.6833] },

    // Viluppuram District
    { city: 'Viluppuram', district: 'Viluppuram', coords: [79.4928, 11.9401] },
    { city: 'Tindivanam', district: 'Viluppuram', coords: [79.6500, 12.2333] },
    { city: 'Gingee', district: 'Viluppuram', coords: [79.4167, 12.2500] },
    { city: 'Kallakurichi', district: 'Viluppuram', coords: [78.9604, 11.7408] },

    // Virudhunagar District
    { city: 'Virudhunagar', district: 'Virudhunagar', coords: [77.9624, 9.5680] },
    { city: 'Sivakasi', district: 'Virudhunagar', coords: [77.7992, 9.4533] },
    { city: 'Srivilliputhur', district: 'Virudhunagar', coords: [77.6333, 9.5167] },
    { city: 'Aruppukkottai', district: 'Virudhunagar', coords: [78.0972, 9.5167] }
]

// Job templates with categories
const JOB_TEMPLATES = [
    { category: 'construction', titleEn: 'Construction Helper', titleTa: 'கட்டுமான உதவியாளர்', wageRange: [600, 900] },
    { category: 'construction', titleEn: 'Mason Required', titleTa: 'கொத்தனார் தேவை', wageRange: [800, 1200] },
    { category: 'plumbing', titleEn: 'Plumber Required', titleTa: 'குழாய் பணியாளர் தேவை', wageRange: [700, 1000] },
    { category: 'plumbing', titleEn: 'Bathroom Fitting', titleTa: 'குளியலறை பொருத்துதல்', wageRange: [800, 1200] },
    { category: 'electrical', titleEn: 'Electrician Needed', titleTa: 'மின்சாரி தேவை', wageRange: [700, 1100] },
    { category: 'electrical', titleEn: 'Fan Installation', titleTa: 'விசிறி நிறுவல்', wageRange: [500, 800] },
    { category: 'painting', titleEn: 'House Painter', titleTa: 'வீடு வண்ணம் பூசுபவர்', wageRange: [700, 1000] },
    { category: 'painting', titleEn: 'Wall Painting', titleTa: 'சுவர் வண்ணம்', wageRange: [600, 900] },
    { category: 'carpentry', titleEn: 'Carpenter Required', titleTa: 'தச்சர் தேவை', wageRange: [700, 1100] },
    { category: 'carpentry', titleEn: 'Door Repair', titleTa: 'கதவு பழுது', wageRange: [600, 900] },
    { category: 'cleaning', titleEn: 'House Cleaning', titleTa: 'வீடு சுத்தம்', wageRange: [350, 500] },
    { category: 'cleaning', titleEn: 'Deep Cleaning', titleTa: 'ஆழ சுத்தம்', wageRange: [500, 700] },
    { category: 'cooking', titleEn: 'Cook Required', titleTa: 'சமையல்காரர்', wageRange: [400, 600] },
    { category: 'cooking', titleEn: 'Event Catering', titleTa: 'நிகழ்ச்சி சமையல்', wageRange: [1000, 2000] },
    { category: 'security', titleEn: 'Security Guard', titleTa: 'பாதுகாப்பு காவலர்', wageRange: [500, 700] },
    { category: 'security', titleEn: 'Night Watchman', titleTa: 'இரவு காவலாளி', wageRange: [550, 750] },
    { category: 'driving', titleEn: 'Driver Required', titleTa: 'டிரைவர் தேவை', wageRange: [600, 900] },
    { category: 'driving', titleEn: 'Delivery Driver', titleTa: 'டெலிவரி டிரைவர்', wageRange: [500, 800] },
    { category: 'farming', titleEn: 'Farm Worker', titleTa: 'பண்ணை தொழிலாளர்', wageRange: [450, 650] },
    { category: 'farming', titleEn: 'Paddy Field Helper', titleTa: 'நெல் வயல் உதவி', wageRange: [400, 600] },
    { category: 'gardening', titleEn: 'Gardener Required', titleTa: 'தோட்டக்காரர்', wageRange: [400, 600] },
    { category: 'delivery', titleEn: 'Delivery Executive', titleTa: 'டெலிவரி நிர்வாகி', wageRange: [500, 750] },
    { category: 'factory-worker', titleEn: 'Factory Worker', titleTa: 'தொழிற்சாலை தொழிலாளர்', wageRange: [500, 700] },
    { category: 'ac-repair', titleEn: 'AC Technician', titleTa: 'ஏசி தொழில்நுட்பர்', wageRange: [800, 1500] }
]

const DURATIONS = ['1 day', '2 days', '3 days', '1 week', '2 weeks', 'Monthly', 'Daily']

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min
}

function getRandomElement(arr) {
    return arr[Math.floor(Math.random() * arr.length)]
}

async function seedJobs() {
    try {
        await mongoose.connect(process.env.MONGODB_URI)
        console.log('✅ Connected to MongoDB')

        // Find or create demo employer
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

        // Clear existing jobs (optional)
        await Job.deleteMany({})
        console.log('🗑️ Cleared existing jobs')

        const jobs = []
        const JOBS_PER_CITY = 10

        // Generate 10 jobs per city
        for (const loc of LOCATIONS) {
            const usedTemplates = new Set()

            for (let i = 0; i < JOBS_PER_CITY; i++) {
                // Get unique template for this city
                let template
                do {
                    template = JOB_TEMPLATES[i % JOB_TEMPLATES.length]
                } while (usedTemplates.has(template.titleEn) && usedTemplates.size < JOB_TEMPLATES.length)
                usedTemplates.add(template.titleEn)

                const wage = getRandomInt(template.wageRange[0], template.wageRange[1])
                const isUrgent = Math.random() < 0.15

                const job = {
                    title: { en: template.titleEn, ta: template.titleTa },
                    description: {
                        en: `${template.titleEn} needed in ${loc.city}, ${loc.district}. Good pay and working conditions.`,
                        ta: `${template.titleTa} ${loc.city}, ${loc.district} இல் தேவை. நல்ல சம்பளம் மற்றும் பணி நிலைமைகள்.`
                    },
                    category: template.category,
                    employer: employer._id,
                    location: `${loc.city}, ${loc.district}`,
                    geoLocation: {
                        type: 'Point',
                        coordinates: [
                            loc.coords[0] + (Math.random() - 0.5) * 0.05,
                            loc.coords[1] + (Math.random() - 0.5) * 0.05
                        ]
                    },
                    wage: wage,
                    wageType: 'daily',
                    duration: getRandomElement(DURATIONS),
                    status: 'open',
                    urgent: isUrgent,
                    requiredWorkers: getRandomInt(1, 3),
                    createdAt: new Date(Date.now() - getRandomInt(0, 7) * 24 * 60 * 60 * 1000)
                }
                jobs.push(job)
            }
            console.log(`📍 ${loc.city}, ${loc.district}: ${JOBS_PER_CITY} jobs`)
        }

        // Bulk insert
        await Job.insertMany(jobs)

        const totalJobs = await Job.countDocuments({ status: 'open' })
        console.log(`\n✅ Seeded ${jobs.length} jobs across ${LOCATIONS.length} cities!`)
        console.log(`📊 Total open jobs: ${totalJobs}`)

    } catch (error) {
        console.error('❌ Error:', error)
    } finally {
        await mongoose.disconnect()
        console.log('🔌 Disconnected')
    }
}

seedJobs()
