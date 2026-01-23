
const mongoose = require('mongoose');
const Job = require('./src/models/Job');
require('dotenv').config();

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const count = await Job.countDocuments({ location: { $regex: /vellore/i } });
        console.log('DB Vellore Jobs:', count);

        // Also check strictly
        const allJobs = await Job.find({ location: { $regex: /vellore/i } }).select('location type');
        console.log('Locations:', allJobs.map(j => j.location));

        await mongoose.disconnect();
    } catch (e) { console.error(e); }
};
run();
