export const JOB_CATEGORIES = [
    { id: 'construction', label: 'Construction', ta: 'கட்டுமானம்', icon: '🏗️' },
    { id: 'electrical', label: 'Electrical', ta: 'மின்சாரம்', icon: '⚡' },
    { id: 'plumbing', label: 'Plumbing', ta: 'குழாய் பணி', icon: '🔧' },
    { id: 'painting', label: 'Painting', ta: 'பெயிண்டிங்', icon: '🎨' },
    { id: 'carpentry', label: 'Carpentry', ta: 'மரவேலை', icon: '🪚' },
    { id: 'masonry', label: 'Masonry & Tiles', ta: 'கற்றளம் & ஓடு', icon: '🧱' },
    { id: 'welding', label: 'Welding & Fabrication', ta: 'வெல்டிங் & உருவாக்கம்', icon: '🔩' },
    { id: 'agriculture', label: 'Agriculture & Farming', ta: 'விவசாயம்', icon: '🌾' },
    { id: 'gardening', label: 'Gardening & Landscaping', ta: 'தோட்டக்கலை', icon: '🌳' },
    { id: 'transport', label: 'Transport & Loading', ta: 'போக்குவரத்து & ஏற்றுதல்', icon: '🚚' },
    { id: 'factory', label: 'Factory & Manufacturing', ta: 'தொழிற்சாலை', icon: '🏭' },
    { id: 'housekeeping', label: 'Domestic Help', ta: 'வீட்டு உதவி', icon: '🧹' },
    { id: 'cooking', label: 'Cooking & Catering', ta: 'சமையல்', icon: '🍳' },
    { id: 'security', label: 'Security & Watchman', ta: 'பாதுகாப்பு', icon: '👮' }
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
    ]
};

// Flattened list for easy searching/lookup if needed
export const ALL_SKILLS = Object.entries(ROLES_BY_CATEGORY).flatMap(([catId, roles]) =>
    roles.map(role => ({
        ...role,
        categoryId: catId
    }))
);

// Icon mapping based on job title keywords
const TITLE_ICON_MAP = [
    { keywords: ['night watch', 'night guard', 'night shift', 'night security'], icon: '🌙' },
    { keywords: ['day guard', 'day shift', 'day security'], icon: '☀️' },
    { keywords: ['event security', 'event', 'function'], icon: '🎟️' },
    { keywords: ['parking'], icon: '🅿️' },
    { keywords: ['gate keeping', 'gate guard', 'gate'], icon: '🚪' },
    { keywords: ['office security', 'office'], icon: '🏢' },
    { keywords: ['building watch', 'building'], icon: '🏗️' },
    { keywords: ['factory guard', 'factory'], icon: '🏭' },
    { keywords: ['atm'], icon: '🏧' },
    { keywords: ['shop security', 'shop'], icon: '🛒' },
    { keywords: ['construction', 'mason', 'brick', 'rcc', 'concrete'], icon: '🏗️' },
    { keywords: ['electric', 'wire', 'fan', 'light'], icon: '⚡' },
    { keywords: ['plumb', 'pipe', 'drainage', 'water tank'], icon: '🔧' },
    { keywords: ['paint', 'texture', 'putty'], icon: '🎨' },
    { keywords: ['carpenter', 'wood', 'door', 'furniture'], icon: '🪚' },
    { keywords: ['clean', 'maid', 'sweep', 'deep cleaning'], icon: '🧹' },
    { keywords: ['cook', 'kitchen', 'catering', 'chef'], icon: '🍳' },
    { keywords: ['driver', 'taxi', 'auto', 'truck', 'van'], icon: '🚗' },
    { keywords: ['garden', 'lawn', 'landscap', 'tree'], icon: '🌳' },
    { keywords: ['delivery', 'courier'], icon: '📦' },
    { keywords: ['babysit', 'nanny', 'child care'], icon: '👶' },
    { keywords: ['elder care', 'senior care', 'caregiver'], icon: '👴' },
    { keywords: ['warehouse', 'loading', 'godown'], icon: '📦' },
    { keywords: ['ac ', 'air condition'], icon: '❄️' },
    { keywords: ['cctv', 'camera'], icon: '📹' },
    { keywords: ['roof', 'waterproof'], icon: '🏠' },
    { keywords: ['tile', 'flooring', 'marble'], icon: '🧱' },
    { keywords: ['weld', 'fabricat', 'grille'], icon: '🔩' },
];

/**
 * Get a detailed icon based on job title, falling back to category icon.
 * @param {string} title - The job title (can be string or object with en/ta keys)
 * @param {string} category - The job category ID
 * @returns {string} An emoji icon
 */
export function getDetailedIcon(title, category) {
    // Normalize title to lowercase string
    let titleStr = '';
    if (typeof title === 'object' && title !== null) {
        titleStr = (title.en || title.ta || '').toLowerCase();
    } else if (typeof title === 'string') {
        titleStr = title.toLowerCase();
    }

    // Search for a matching keyword
    for (const mapping of TITLE_ICON_MAP) {
        for (const keyword of mapping.keywords) {
            if (titleStr.includes(keyword)) {
                return mapping.icon;
            }
        }
    }

    // Fallback to category icon
    const categoryObj = JOB_CATEGORIES.find(c => c.id === category);
    return categoryObj?.icon || '💼';
}

