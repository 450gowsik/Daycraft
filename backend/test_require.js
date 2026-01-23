try {
    const adminController = require('./src/controllers/admin.controller.js');
    console.log('Successfully loaded admin.controller.js');
    console.log('Exported functions:', Object.keys(adminController));
} catch (err) {
    console.error('Failed to load admin.controller.js:');
    console.error(err);
}
