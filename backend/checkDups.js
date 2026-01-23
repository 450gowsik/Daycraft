
const mongoose = require('mongoose');
const Job = require('./src/models/Job');
require('dotenv').config();

const checkDuplicates = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);

        const duplicates = await Job.aggregate([
            {
                $group: {
                    _id: { title: "$title.en", employer: "$employer", location: "$location" },
                    count: { $sum: 1 },
                    docs: { $push: "$_id" }
                }
            },
            {
                $match: {
                    count: { $gt: 1 }
                }
            }
        ]);

        console.log(`Found ${duplicates.length} sets of duplicates.`);
        if (duplicates.length > 0) {
            console.log('Sample Duplicate:', JSON.stringify(duplicates[0], null, 2));
        } else {
            console.log('No duplicates found based on Title+Employer+Location.');
        }

        const total = await Job.countDocuments();
        console.log(`Total Jobs: ${total}`);

        await mongoose.disconnect();
    } catch (e) {
        console.error(e);
    }
};
checkDuplicates();
