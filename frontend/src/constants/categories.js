export const JOB_CATEGORIES = [
    { id: 'construction', label: 'Construction', ta: 'கட்டுமானம்', abbr: 'CO', color: '#E8500A' },
    { id: 'electrical', label: 'Electrical', ta: 'மின்சாரம்', abbr: 'EL', color: '#D97706' },
    { id: 'plumbing', label: 'Plumbing', ta: 'குழாய் பணி', abbr: 'PL', color: '#0891B2' },
    { id: 'painting', label: 'Painting', ta: 'பெயிண்டிங்', abbr: 'PA', color: '#DB2777' },
    { id: 'carpentry', label: 'Carpentry', ta: 'மரவேலை', abbr: 'CA', color: '#92400E' },
    { id: 'masonry', label: 'Masonry & Tiles', ta: 'கற்றளம் & ஓடு', abbr: 'MA', color: '#6B7280' },
    { id: 'welding', label: 'Welding & Fabrication', ta: 'வெல்டிங் & உருவாக்கம்', abbr: 'WE', color: '#374151' },
    { id: 'agriculture', label: 'Agriculture & Farming', ta: 'விவசாயம்', abbr: 'AG', color: '#15803D' },
    { id: 'gardening', label: 'Gardening & Landscaping', ta: 'தோட்டக்கலை', abbr: 'GA', color: '#16A34A' },
    { id: 'transport', label: 'Transport & Loading', ta: 'போக்குவரத்து & ஏற்றுதல்', abbr: 'TR', color: '#1D4ED8' },
    { id: 'factory', label: 'Factory & Manufacturing', ta: 'தொழிற்சாலை', abbr: 'FA', color: '#7C3AED' },
    { id: 'housekeeping', label: 'Domestic Help', ta: 'வீட்டு உதவி', abbr: 'HK', color: '#9D174D' },
    { id: 'cooking', label: 'Cooking & Catering', ta: 'சமையல்', abbr: 'CK', color: '#DC2626' },
    { id: 'security', label: 'Security & Watchman', ta: 'பாதுகாப்பு', abbr: 'SE', color: '#1E3A5F' },
    { id: 'development', label: 'Development & IT', ta: 'தகவல் தொழில்நுட்பம்', abbr: 'IT', color: '#0E7490' }
];

export const ROLES_BY_CATEGORY = {
    construction: [
        { id: 'construction_worker', label: 'Construction Worker', ta: 'கட்டுமான தொழிலாளி' },
        { id: 'mason', label: 'Mason', ta: 'மேசன்' },
        { id: 'helper', label: 'Helper', ta: 'உதவியாளர்' },
        { id: 'site_supervisor', label: 'Site Supervisor', ta: 'தள மேற்பார்வையாளர்' },
        { id: 'centering_worker', label: 'Centering Worker', ta: 'செண்டரிங் தொழிலாளி' },
        { id: 'bar_bender', label: 'Bar Bender', ta: 'இரும்பு கம்பி தொழிலாளி' }
    ],
    electrical: [
        { id: 'electrician', label: 'Electrician', ta: 'எலக்ட்ரீசியன்' },
        { id: 'wireman', label: 'Wireman', ta: 'வயர்மேன்' },
        { id: 'ac_technician', label: 'AC Technician', ta: 'AC தொழில்நுட்பர்' },
        { id: 'appliance_repair', label: 'Appliance Repair', ta: 'சாதன பழுது' }
    ],
    plumbing: [
        { id: 'plumber', label: 'Plumber', ta: 'பிளம்பர்' },
        { id: 'pipe_fitter', label: 'Pipe Fitter', ta: 'குழாய் பொருத்துபவர்' },
        { id: 'borewell_worker', label: 'Borewell Worker', ta: 'போர்வெல் தொழிலாளி' },
        { id: 'sanitary_worker', label: 'Sanitary Worker', ta: 'சுகாதார பணியாளர்' }
    ],
    painting: [
        { id: 'painter', label: 'Painter', ta: 'பெயிண்டர்' },
        { id: 'wall_painter', label: 'Wall Painter', ta: 'சுவர் பெயிண்டர்' },
        { id: 'putty_worker', label: 'Putty & Primer', ta: 'புட்டி தொழிலாளி' },
        { id: 'texture_painter', label: 'Texture Painter', ta: 'டெக்ஸ்சர் பெயிண்டர்' }
    ],
    carpentry: [
        { id: 'carpenter', label: 'Carpenter', ta: 'தச்சன்' },
        { id: 'furniture_maker', label: 'Furniture Maker', ta: 'தளபாடங்கள் செய்பவர்' },
        { id: 'wood_polisher', label: 'Wood Polisher', ta: 'மரம் பாலிஷ்' },
        { id: 'door_fitter', label: 'Door & Window Fitter', ta: 'கதவு பொருத்துபவர்' }
    ],
    masonry: [
        { id: 'tile_worker', label: 'Tile Worker', ta: 'ஓடு தொழிலாளி' },
        { id: 'stone_mason', label: 'Stone Mason', ta: 'கற்றளம்' },
        { id: 'flooring_worker', label: 'Flooring Worker', ta: 'தரை தொழிலாளி' },
        { id: 'marble_polisher', label: 'Marble Polisher', ta: 'மார்பிள் பாலிஷ்' }
    ],
    welding: [
        { id: 'welder', label: 'Welder', ta: 'வெல்டர்' },
        { id: 'fabricator', label: 'Fabricator', ta: 'உருவாக்குபவர்' },
        { id: 'grille_maker', label: 'Grille Maker', ta: 'கிரில் செய்பவர்' },
        { id: 'gate_maker', label: 'Gate Maker', ta: 'கேட் செய்பவர்' }
    ],
    agriculture: [
        { id: 'farm_worker', label: 'Farm Worker', ta: 'விவசாய தொழிலாளி' },
        { id: 'harvester', label: 'Harvester', ta: 'அறுவடையாளர்' },
        { id: 'tractor_driver', label: 'Tractor Driver', ta: 'டிராக்டர் ஓட்டுநர்' },
        { id: 'irrigation_worker', label: 'Irrigation Worker', ta: 'பாசன தொழிலாளி' }
    ],
    gardening: [
        { id: 'gardener', label: 'Gardener', ta: 'தோட்டக்காரர்' },
        { id: 'landscaper', label: 'Landscaper', ta: 'நிலப்பரப்பாளர்' },
        { id: 'tree_cutter', label: 'Tree Cutter', ta: 'மரம் வெட்டுபவர்' },
        { id: 'lawn_maintenance', label: 'Lawn Maintenance', ta: 'புல்வெளி பராமரிப்பு' }
    ],
    transport: [
        { id: 'driver', label: 'Driver', ta: 'ஓட்டுநர்' },
        { id: 'auto_driver', label: 'Auto Driver', ta: 'ஆட்டோ ஓட்டுநர்' },
        { id: 'loader', label: 'Loader', ta: 'ஏற்றுபவர்' },
        { id: 'mover_packer', label: 'Mover & Packer', ta: 'பொருள் இடமாற்றம்' }
    ],
    factory: [
        { id: 'machine_operator', label: 'Machine Operator', ta: 'இயந்திர ஆபரேட்டர்' },
        { id: 'assembly_worker', label: 'Assembly Worker', ta: 'அசெம்பிளி தொழிலாளி' },
        { id: 'packing_worker', label: 'Packing Worker', ta: 'பேக்கிங் தொழிலாளி' },
        { id: 'quality_checker', label: 'Quality Checker', ta: 'தர சோதனையாளர்' }
    ],
    housekeeping: [
        { id: 'house_maid', label: 'House Maid', ta: 'வீட்டு வேலைக்காரி' },
        { id: 'cleaner', label: 'Cleaner', ta: 'துப்புரவாளர்' },
        { id: 'cook_helper', label: 'Cook Helper', ta: 'சமையல் உதவியாளர்' },
        { id: 'elderly_care', label: 'Elderly Care', ta: 'முதியோர் பராமரிப்பு' }
    ],
    cooking: [
        { id: 'cook', label: 'Cook', ta: 'சமையல்காரர்' },
        { id: 'caterer', label: 'Caterer', ta: 'கேட்டரர்' },
        { id: 'helper', label: 'Kitchen Helper', ta: 'சமையலறை உதவியாளர்' },
        { id: 'event_cook', label: 'Event Cook', ta: 'நிகழ்ச்சி சமையல்' }
    ],
    security: [
        { id: 'security_guard', label: 'Security Guard', ta: 'பாதுகாவலர்' },
        { id: 'watchman', label: 'Watchman', ta: 'காவலாளி' },
        { id: 'night_guard', label: 'Night Guard', ta: 'இரவு காவலாளி' },
        { id: 'parking_attendant', label: 'Parking Attendant', ta: 'பார்க்கிங் உதவியாளர்' }
    ],
    development: [
        { id: 'web_developer', label: 'Web Developer', ta: 'இணையதள மேம்பாட்டாளர்' },
        { id: 'app_developer', label: 'App Developer', ta: 'ஆப் மேம்பாட்டாளர்' },
        { id: 'software_engineer', label: 'Software Engineer', ta: 'மென்பொருள் பொறியாளர்' },
        { id: 'it_support', label: 'IT Support', ta: 'தகவல் தொழில்நுட்ப ஆதரவு' },
        { id: 'graphic_designer', label: 'Graphic Designer', ta: 'கிராபிக்ஸ் வடிவமைப்பாளர்' },
        { id: 'ui_ux_designer', label: 'UI/UX Designer', ta: 'UI/UX வடிவமைப்பாளர்' },
        { id: 'data_entry', label: 'Data Entry', ta: 'தரவு உள்ளீடு' },
        { id: 'digital_marketing', label: 'Digital Marketing', ta: 'டிஜிட்டல் மார்க்கெட்டிங்' }
    ]
};

// Flattened list for easy searching/lookup if needed
export const ALL_SKILLS = Object.entries(ROLES_BY_CATEGORY).flatMap(([catId, roles]) =>
    roles.map(role => ({
        ...role,
        categoryId: catId
    }))
);

/**
 * Get a category abbreviation badge element props based on job category.
 * Returns { abbr, color } for rendering a colored badge.
 * @param {string} category - The job category ID
 * @returns {{ abbr: string, color: string }}
 */
export function getCategoryBadge(category) {
    const cat = JOB_CATEGORIES.find(c => c.id === category);
    return cat
        ? { abbr: cat.abbr, color: cat.color }
        : { abbr: 'JB', color: '#6B7280' };
}

/**
 * Get detailed category badge based on job title keywords, falling back to category.
 * @param {string|object} title - The job title
 * @param {string} category - The job category ID
 * @returns {{ abbr: string, color: string }}
 */
export function getDetailedIcon(title, category) {
    // This now returns a badge object instead of an emoji
    return getCategoryBadge(category);
}
