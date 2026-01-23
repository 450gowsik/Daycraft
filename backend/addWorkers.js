/**
 * Script to add 200 demo workers across different districts
 * Run: node addWorkers.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/daycraft';

// Tamil Nadu Districts
const districts = [
    'Chennai', 'Coimbatore', 'Madurai', 'Tiruchirappalli', 'Salem',
    'Tirunelveli', 'Tirupur', 'Vellore', 'Erode', 'Theni',
    'Thoothukudi', 'Dindigul', 'Thanjavur', 'Ranipet', 'Sivaganga',
    'Kanyakumari', 'Karur', 'Virudhunagar', 'Nagapattinam', 'Namakkal'
];

// Areas within Chennai
const chennaiAreas = [
    'Adyar', 'Velachery', 'T Nagar', 'Anna Nagar', 'Vadapalani',
    'Porur', 'Guindy', 'Egmore', 'Mylapore', 'Nungambakkam',
    'Kodambakkam', 'Besant Nagar', 'Thiruvanmiyur', 'Tambaram', 'Chromepet'
];

// Worker skills
const skillsList = [
    { en: 'Painting', ta: 'பெயிண்டிங்' },
    { en: 'Plumbing', ta: 'குழாய் வேலை' },
    { en: 'Electrical', ta: 'மின்சார வேலை' },
    { en: 'Carpentry', ta: 'தச்சு வேலை' },
    { en: 'Masonry', ta: 'கொத்தனார் வேலை' },
    { en: 'Welding', ta: 'வெல்டிங்' },
    { en: 'AC Repair', ta: 'ஏசி பழுது' },
    { en: 'Cleaning', ta: 'சுத்தம் செய்தல்' },
    { en: 'Gardening', ta: 'தோட்டக்கலை' },
    { en: 'Construction', ta: 'கட்டுமானம்' },
    { en: 'Driving', ta: 'வாகனம் ஓட்டுதல்' },
    { en: 'Cooking', ta: 'சமையல்' },
    { en: 'Security', ta: 'பாதுகாப்பு' },
    { en: 'Loading', ta: 'சரக்கு ஏற்றுதல்' },
    { en: 'Housekeeping', ta: 'வீட்டு பராமரிப்பு' }
];

// Tamil names
const firstNames = [
    'Ramesh', 'Suresh', 'Murugan', 'Karthik', 'Senthil', 'Arun', 'Kumar',
    'Ravi', 'Vignesh', 'Prakash', 'Ganesh', 'Selvam', 'Dinesh', 'Rajesh',
    'Manikandan', 'Balaji', 'Vijay', 'Anand', 'Gopal', 'Mohan', 'Shankar',
    'Srinivasan', 'Venkatesh', 'Durai', 'Kannan', 'Mariappan', 'Saravanan',
    'Arjun', 'Pradeep', 'Naveen', 'Velu', 'Pandian', 'Subramani', 'Velan'
];

const lastNames = [
    'Kumar', 'Rajan', 'Pillai', 'Nadar', 'Gounder', 'Mudaliar', 'Thevar',
    'Iyer', 'Iyengar', 'Reddy', 'Naidu', 'Chettiar', 'Vanniar', 'Yadav'
];

// Generate random data
const random = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

const generateWorkers = (count) => {
    const workers = [];

    for (let i = 0; i < count; i++) {
        const district = random(districts);
        const area = district === 'Chennai' ? random(chennaiAreas) : district;
        const location = district === 'Chennai' ? `Chennai, ${area}` : `${district}, ${district}`;

        // Random 2-4 skills
        const numSkills = randomInt(1, 4);
        const shuffledSkills = [...skillsList].sort(() => 0.5 - Math.random());
        const skills = shuffledSkills.slice(0, numSkills);

        const firstName = random(firstNames);
        const lastName = random(lastNames);

        workers.push({
            name: `${firstName} ${lastName}`,
            email: `worker${i + 1}@demo.daycraft.com`,
            phone: `98${randomInt(10000000, 99999999)}`,
            password: '$2a$10$dummyhashedpassword',
            role: 'worker',
            location: location,
            district: district,
            skills: skills,
            experience: randomInt(0, 15),
            dailyRate: randomInt(4, 15) * 100, // 400-1500
            rating: (Math.random() * 2 + 3).toFixed(1), // 3.0-5.0
            reviewCount: randomInt(0, 50),
            completedJobs: randomInt(0, 100),
            bio: `Experienced ${skills[0]?.en || 'worker'} professional from ${district}`,
            phoneVerified: true,
            isActive: true,
            availability: random(['available', 'busy', 'available', 'available']),
            createdAt: new Date(Date.now() - randomInt(0, 90) * 24 * 60 * 60 * 1000)
        });
    }

    return workers;
};

const addWorkers = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected to MongoDB');

        // Define User schema
        const userSchema = new mongoose.Schema({}, { strict: false });
        const User = mongoose.models.User || mongoose.model('User', userSchema);

        // Delete existing demo workers (optional - comment out to keep existing)
        const deleted = await User.deleteMany({ email: { $regex: /@demo\.daycraft\.com$/ } });
        console.log(`🗑️ Deleted ${deleted.deletedCount} existing demo workers`);

        // Generate and insert workers
        const workers = generateWorkers(200);
        const result = await User.insertMany(workers);

        console.log(`✅ Added ${result.length} demo workers`);

        // Show district distribution
        const districtCounts = {};
        workers.forEach(w => {
            districtCounts[w.district] = (districtCounts[w.district] || 0) + 1;
        });

        console.log('\n📊 Workers by District:');
        Object.entries(districtCounts)
            .sort((a, b) => b[1] - a[1])
            .forEach(([district, count]) => {
                console.log(`   ${district}: ${count} workers`);
            });

        await mongoose.disconnect();
        console.log('\n✅ Done! 200 workers added across districts.');

    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
};

addWorkers();
