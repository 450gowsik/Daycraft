// Seed 50 jobs per category = 700 jobs total
const mongoose = require('mongoose')

const categories = [
    'construction', 'electrical', 'plumbing', 'painting', 'carpentry',
    'masonry', 'welding', 'agriculture', 'gardening', 'transport',
    'factory', 'housekeeping', 'cooking', 'security'
]

const locations = [
    'Chennai', 'Coimbatore', 'Madurai', 'Tiruchirappalli', 'Salem',
    'Tirunelveli', 'Tirupur', 'Vellore', 'Erode', 'Theni',
    'Thoothukudi', 'Dindigul', 'Thanjavur', 'Ranipet', 'Sivaganga',
    'Kanyakumari', 'Karur', 'Virudhunagar', 'Nagapattinam', 'Namakkal'
]

const jobTitles = {
    construction: ['Building Helper', 'Site Work', 'Centering Work', 'Bar Bending', 'Concrete Mixing', 'Foundation Work', 'Brick Laying', 'Plastering', 'Demolition Work', 'Scaffolding'],
    electrical: ['House Wiring', 'AC Installation', 'Fan Repair', 'Motor Winding', 'Switch Board', 'Inverter Setup', 'CCTV Fitting', 'Meter Reading', 'Cable Laying', 'Earthing Work'],
    plumbing: ['Bathroom Fitting', 'Tank Installation', 'Pipe Repair', 'Borewell Work', 'Water Heater', 'Drainage Fix', 'Tap Fitting', 'Pump Repair', 'Sewage Work', 'Pipeline'],
    painting: ['House Painting', 'Wall Putty', 'Exterior Paint', 'Texture Work', 'Primer Coat', 'Colour Wash', 'Enamel Paint', 'Distemper', 'Oil Painting', 'Touch Up'],
    carpentry: ['Door Fitting', 'Furniture Repair', 'Cabinet Making', 'Window Work', 'Wood Polish', 'Bed Making', 'Table Work', 'Shelf Fitting', 'Partition', 'Loft Making'],
    masonry: ['Tile Fitting', 'Floor Work', 'Marble Polish', 'Stone Work', 'Granite Laying', 'Wall Tiles', 'Bathroom Tiles', 'Kitchen Platform', 'Paving Work', 'Coping Work'],
    welding: ['Gate Making', 'Grille Work', 'Railing', 'Door Repair', 'Tank Welding', 'Window Grille', 'Shed Work', 'Staircase', 'Collapsible Gate', 'Rolling Shutter'],
    agriculture: ['Paddy Harvest', 'Ploughing', 'Coconut Pluck', 'Sugarcane Cut', 'Cotton Pick', 'Groundnut Work', 'Banana Harvest', 'Rice Planting', 'Weeding Work', 'Field Clearing'],
    gardening: ['Garden Care', 'Tree Trimming', 'Lawn Mowing', 'Plant Work', 'Hedge Cutting', 'Flower Bed', 'Grass Laying', 'Pruning', 'Landscaping', 'Sprinkler Install'],
    transport: ['Loading Work', 'Shifting Help', 'Warehouse Work', 'Delivery Help', 'Packing Work', 'Unloading', 'Material Carry', 'Tempo Driver', 'Auto Driver', 'Van Helper'],
    factory: ['Machine Work', 'Packing Job', 'Assembly Work', 'Quality Check', 'Sorting Work', 'Labeling', 'Cutting Work', 'Stitching', 'Printing Help', 'Dispatch Work'],
    housekeeping: ['House Cleaning', 'Office Clean', 'Deep Clean', 'Elder Care', 'Baby Sitting', 'Cooking Help', 'Ironing Work', 'Dish Washing', 'Mopping Work', 'Dusting'],
    cooking: ['Event Cook', 'Daily Cook', 'Catering Help', 'Kitchen Work', 'Biryani Making', 'Sweet Making', 'Tiffin Service', 'Mess Cooking', 'Party Cook', 'Function Cook'],
    security: ['Night Watch', 'Day Guard', 'Event Security', 'Parking Help', 'Gate Keeping', 'Office Security', 'Building Watch', 'Factory Guard', 'Bank Security', 'Mall Security']
}

const wageRanges = {
    construction: [500, 800], electrical: [600, 900], plumbing: [600, 850],
    painting: [500, 900], carpentry: [600, 1000], masonry: [700, 1000],
    welding: [700, 1100], agriculture: [400, 600], gardening: [400, 600],
    transport: [500, 700], factory: [450, 650], housekeeping: [350, 600],
    cooking: [400, 800], security: [500, 800]
}

async function seedMassiveJobs() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/daycraft')
        console.log('Connected to MongoDB')

        const employers = await mongoose.connection.db.collection('users')
            .find({ role: 'employer' }).limit(50).toArray()

        if (employers.length === 0) {
            const result = await mongoose.connection.db.collection('users').insertOne({
                name: 'DayCraft Employer', email: 'employer@daycraft.com',
                phone: '+919876543210', role: 'employer', isActive: true, createdAt: new Date()
            })
            employers.push({ _id: result.insertedId, name: 'DayCraft Employer' })
        }

        const jobs = []
        const JOBS_PER_CATEGORY = 50

        for (const category of categories) {
            const titles = jobTitles[category]
            const [minWage, maxWage] = wageRanges[category]

            for (let i = 0; i < JOBS_PER_CATEGORY; i++) {
                const title = titles[i % titles.length]
                const location = locations[i % locations.length]
                const employer = employers[i % employers.length]
                const wage = minWage + Math.floor(Math.random() * (maxWage - minWage))
                const isUrgent = Math.random() > 0.75

                jobs.push({
                    title: { en: title, ta: title },
                    description: {
                        en: `Need workers for ${title.toLowerCase()}. Good pay.`,
                        ta: `${title} பணிக்கு தொழிலாளர்கள் தேவை.`
                    },
                    category,
                    location,
                    wage,
                    wageType: 'daily',
                    duration: ['1 day', '2-3 days', '1 week'][Math.floor(Math.random() * 3)],
                    workersNeeded: Math.floor(Math.random() * 5) + 1,
                    employer: employer._id,
                    employerName: employer.name,
                    status: 'open',
                    isUrgent,
                    contactPhone: `+91 ${9000000000 + Math.floor(Math.random() * 999999999)}`,
                    skills: [title.split(' ')[0]],
                    postedAt: new Date(Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000)),
                    expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
                    applicants: [],
                    createdAt: new Date()
                })
            }
        }

        await mongoose.connection.db.collection('jobs').deleteMany({})
        const result = await mongoose.connection.db.collection('jobs').insertMany(jobs)

        console.log(`\n✅ Seeded ${result.insertedCount} jobs (${JOBS_PER_CATEGORY} per category)`)
        console.log(`\n📊 Categories: ${categories.length}`)
        console.log(`📊 Total jobs: ${categories.length * JOBS_PER_CATEGORY}`)

        await mongoose.disconnect()
        process.exit(0)
    } catch (error) {
        console.error('Error:', error.message)
        process.exit(1)
    }
}

seedMassiveJobs()
