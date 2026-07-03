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
    { id: 'development', label: 'Development & IT', ta: 'தகவல் தொழில்நுட்பம்', abbr: 'IT', color: '#0E7490' },
    { id: 'healthcare', label: 'Healthcare', ta: 'சுகாதாரம்', abbr: 'HE', color: '#EF4444' },
    { id: 'education', label: 'Education & Teaching', ta: 'கல்வி மற்றும் கற்பித்தல்', abbr: 'ED', color: '#F59E0B' },
    { id: 'finance', label: 'Finance & Accounts', ta: 'நிதி மற்றும் கணக்குகள்', abbr: 'FI', color: '#10B981' },
    { id: 'design', label: 'Arts & Design', ta: 'கலை மற்றும் வடிவமைப்பு', abbr: 'DE', color: '#EC4899' },
    { id: 'retail', label: 'Retail & Sales', ta: 'சில்லறை விற்பனை', abbr: 'RE', color: '#8B5CF6' },
    { id: 'hospitality', label: 'Hospitality & Tourism', ta: 'விருந்தோம்பல்', abbr: 'HO', color: '#F43F5E' },
    { id: 'legal', label: 'Legal Services', ta: 'சட்ட சேவைகள்', abbr: 'LE', color: '#64748B' },
    { id: 'admin', label: 'Admin & Office Support', ta: 'அலுவலக நிர்வாகம்', abbr: 'AD', color: '#3B82F6' },
    { id: 'creative', label: 'Creative & Writing', ta: 'படைப்பாற்றல் & எழுத்து', abbr: 'CW', color: '#D946EF' },
    { id: 'other', label: 'Others', ta: 'இதர வேலைகள்', abbr: 'OT', color: '#64748b' }
];

export const ROLES_BY_CATEGORY = {
    construction: [
        { id: 'construction_worker', label: 'Construction Worker', ta: 'கட்டுமான தொழிலாளி' },
        { id: 'mason', label: 'Mason', ta: 'மேசன்' },
        { id: 'helper', label: 'Helper', ta: 'உதவியாளர்' },
        { id: 'site_supervisor', label: 'Site Supervisor', ta: 'தள மேற்பார்வையாளர்' },
        { id: 'centering_worker', label: 'Centering Worker', ta: 'செண்டரிங் தொழிலாளி' },
        { id: 'bar_bender', label: 'Bar Bender', ta: 'இரும்பு கம்பி தொழிலாளி' },
        { id: 'civil_engineer', label: 'Civil Engineer', ta: 'சிவில் பொறியாளர்' },
        { id: 'architect', label: 'Architect', ta: 'கட்டிடக்கலைஞர்' },
        { id: 'construction_manager', label: 'Construction Manager', ta: 'கட்டுமான மேலாளர்' }
    ],
    electrical: [
        { id: 'electrician', label: 'Electrician', ta: 'எலக்ட்ரீசியன்' },
        { id: 'wireman', label: 'Wireman', ta: 'வயர்மேன்' },
        { id: 'ac_technician', label: 'AC Technician', ta: 'AC தொழில்நுட்பர்' },
        { id: 'appliance_repair', label: 'Appliance Repair', ta: 'சாதன பழுது' },
        { id: 'electrical_apprentice', label: 'Electrician Apprentice', ta: 'மின்சார பயிற்சிப் பணியாளர்' }
    ],
    plumbing: [
        { id: 'plumber', label: 'Plumber', ta: 'பிளம்பர்' },
        { id: 'pipe_fitter', label: 'Pipe Fitter', ta: 'குழாய் பொருத்துபவர்' },
        { id: 'borewell_worker', label: 'Borewell Worker', ta: 'போர்வெல் தொழிலாளி' },
        { id: 'sanitary_worker', label: 'Sanitary Worker', ta: 'சுகாதார பணியாளர்' },
        { id: 'plumbing_apprentice', label: 'Plumber Apprentice', ta: 'பிளம்பிங் பயிற்சிப் பணியாளர்' }
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
        { id: 'gate_maker', label: 'Gate Maker', ta: 'கேட் செய்பவர்' },
        { id: 'welding_technician', label: 'Welding Technician', ta: 'வெல்டிங் தொழில்நுட்ப வல்லுநர்' }
    ],
    agriculture: [
        { id: 'farm_worker', label: 'Farm Worker', ta: 'விவசாய தொழிலாளி' },
        { id: 'harvester', label: 'Harvester', ta: 'அறுவடையாளர்' },
        { id: 'tractor_driver', label: 'Tractor Driver', ta: 'டிராக்டர் ஓட்டுநர்' },
        { id: 'irrigation_worker', label: 'Irrigation Worker', ta: 'பாசன தொழிலாளி' },
        { id: 'harvest_farm_worker', label: 'Harvest Farm Worker', ta: 'அறுவடை பண்ணை தொழிலாளி' }
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
        { id: 'quality_checker', label: 'Quality Checker', ta: 'தர சோதனையாளர்' },
        { id: 'production_engineer', label: 'Production Engineer', ta: 'உற்பத்தி பொறியாளர்' },
        { id: 'factory_supervisor', label: 'Factory Supervisor', ta: 'தொழிற்சாலை மேற்பார்வையாளர்' },
        { id: 'quality_control', label: 'Quality Control Specialist', ta: 'தர கட்டுப்பாட்டு நிபுணர்' }
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
        { id: 'digital_marketing', label: 'Digital Marketing', ta: 'டிஜிட்டல் மார்க்கெட்டிங்' },
        { id: 'data_analyst', label: 'Data Analyst', ta: 'தரவு ஆய்வாளர்' },
        { id: 'cyber_security', label: 'Cyber Security Analyst', ta: 'சைபர் பாதுகாப்பு ஆய்வாளர்' },
        { id: 'seo_consultant', label: 'SEO Consultant', ta: 'எஸ்சிஓ ஆலோசகர்' },
        { id: 'remote_software_engineer', label: 'Remote Software Engineer', ta: 'தொலைதூர மென்பொருள் பொறியாளர்' },
        { id: 'project_manager', label: 'Project Manager', ta: 'திட்ட மேலாளர்' }
    ],
    healthcare: [
        { id: 'doctor', label: 'Doctor', ta: 'மருத்துவர்' },
        { id: 'nurse', label: 'Nurse', ta: 'செவிலியர்' },
        { id: 'pharmacist', label: 'Pharmacist', ta: 'மருந்தாளுனர்' },
        { id: 'medical_assistant', label: 'Medical Assistant', ta: 'மருத்துவ உதவியாளர்' }
    ],
    education: [
        { id: 'teacher', label: 'School Teacher', ta: 'பள்ளி ஆசிரியர்' },
        { id: 'professor', label: 'Professor', ta: 'பேராசிரியர்' },
        { id: 'counselor', label: 'Education Counselor', ta: 'கல்வி ஆலோசகர்' },
        { id: 'tutor', label: 'Tutor / Private Teacher', ta: 'வீட்டுப் பாடம் கற்பிப்பவர்' },
        { id: 'teaching_assistant', label: 'Teaching Assistant', ta: 'கற்பித்தல் உதவியாளர்' },
        { id: 'camp_counselor', label: 'Summer Camp Counselor', ta: 'கோடைக்கால முகாம் ஆலோசகர்' }
    ],
    finance: [
        { id: 'accountant', label: 'Accountant', ta: 'கணக்காளர்' },
        { id: 'financial_analyst', label: 'Financial Analyst', ta: 'நிதி ஆய்வாளர்' },
        { id: 'auditor', label: 'Auditor', ta: 'தணிக்கையாளர்' },
        { id: 'investment_banker', label: 'Investment Banker', ta: 'முதலீட்டு வங்கியாளர்' },
        { id: 'tax_consultant', label: 'Tax Consultant', ta: 'வரி ஆலோசகர்' }
    ],
    design: [
        { id: 'graphic_designer', label: 'Graphic Designer', ta: 'வரைபட வடிவமைப்பாளர்' },
        { id: 'creative_director', label: 'Creative Director', ta: 'படைப்பு இயக்குனர்' },
        { id: 'ui_ux_designer', label: 'UI/UX Designer', ta: 'பயனர் இடைமுக வடிவமைப்பாளர்' },
        { id: 'illustrator', label: 'Illustrator', ta: 'விளக்கப் படக் கலைஞர்' },
        { id: 'fashion_designer', label: 'Fashion Designer', ta: 'ஆடை வடிவமைப்பாளர்' },
        { id: 'animator', label: 'Animator', ta: 'அனிமேட்டர்' },
        { id: 'videographer', label: 'Videographer', ta: 'வீடியோகிராபர்' }
    ],
    retail: [
        { id: 'sales_associate', label: 'Sales Associate', ta: 'விற்பனை உதவியாளர்' },
        { id: 'cashier', label: 'Cashier', ta: 'காசாளர்' },
        { id: 'store_manager', label: 'Store Manager', ta: 'கடை மேலாளர்' },
        { id: 'visual_merchandiser', label: 'Visual Merchandiser', ta: 'காட்சி விற்பனையாளர்' },
        { id: 'holiday_sales_associate', label: 'Holiday Sales Associate', ta: 'விடுமுறைக்கால விற்பனை உதவியாளர்' },
        { id: 'boutique_owner', label: 'Boutique Owner', ta: 'பூட்டிக் உரிமையாளர்' }
    ],
    hospitality: [
        { id: 'hotel_manager', label: 'Hotel Manager', ta: 'ஹோட்டல் மேலாளர்' },
        { id: 'chef', label: 'Chef', ta: 'தலைமை சமையல்காரர்' },
        { id: 'waitstaff', label: 'Waitstaff', ta: 'பரிமாறுபவர்' },
        { id: 'front_desk_executive', label: 'Front Desk Executive', ta: 'வரவேற்பாளர்' },
        { id: 'event_planner', label: 'Event Planner', ta: 'நிகழ்ச்சி திட்டமிடுபவர்' },
        { id: 'barista', label: 'Barista', ta: 'பாரிஸ்டா காபி தயாரிப்பாளர்' },
        { id: 'cafe_owner', label: 'Cafe Owner', ta: 'கஃபே உரிமையாளர்' }
    ],
    legal: [
        { id: 'lawyer', label: 'Lawyer', ta: 'வழக்கறிஞர்' },
        { id: 'legal_advisor', label: 'Legal Advisor', ta: 'சட்ட ஆலோசகர்' },
        { id: 'paralegal', label: 'Paralegal', ta: 'சட்ட உதவியாளர்' },
        { id: 'judge', label: 'Judge', ta: 'நீதிபதி' }
    ],
    admin: [
        { id: 'virtual_assistant', label: 'Virtual Assistant', ta: 'மெய்நிகர் உதவியாளர்' },
        { id: 'office_assistant', label: 'Office Assistant', ta: 'அலுவலக உதவியாளர்' },
        { id: 'data_entry_operator', label: 'Data Entry Operator', ta: 'தரவு உள்ளீட்டு ஆபரேட்டர்' },
        { id: 'hr_assistant', label: 'HR Assistant', ta: 'மனிதவள உதவியாளர்' },
        { id: 'receptionist', label: 'Receptionist', ta: 'வரவேற்பாளர்' }
    ],
    creative: [
        { id: 'content_writer', label: 'Content Writer', ta: 'உள்ளடக்க எழுத்தாளர்' },
        { id: 'musician', label: 'Musician', ta: 'இசைக்கலைஞர்' },
        { id: 'freelance_marketer', label: 'Freelance Marketer', ta: 'சுயாதீன சந்தைப்படுத்துபவர்' },
        { id: 'startup_founder', label: 'Startup Founder', ta: 'துவக்க நிறுவன நிறுவனர்' }
    ],
    other: [
        { id: 'other_worker', label: 'General Worker', ta: 'பொது தொழிலாளி' }
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
    return getCategoryBadge(category);
}

export const DESCRIPTION_TEMPLATES = {
    construction: {
        en: [
            "We need a construction worker for general building and site clearance work. Timing: 9 AM to 5 PM.",
            "Experienced builder needed for concrete mixing and bricklaying work. Daily wage paid at end of day.",
            "Helper required for carrying materials and assisting the head mason at the construction site."
        ],
        ta: [
            "கட்டிடம் கட்டுதல் மற்றும் தளம் சுத்தம் செய்யும் வேலைக்கு ஆள் தேவை. நேரம்: காலை 9 மணி முதல் மாலை 5 மணி வரை.",
            "கான்கிரீட் கலவை மற்றும் செங்கல் அடுக்க அனுபவம் வாய்ந்த தொழிலாளி தேவை. அன்றாட கூலி வழங்கப்படும்.",
            "கட்டுமான தளத்தில் பொருட்களை கொண்டு செல்லவும், கொத்தனாருக்கு உதவவும் உதவியாளர் தேவை."
        ]
    },
    electrical: {
        en: [
            "Electrician needed for house wiring and installing lights/fans. Must have prior experience.",
            "Urgent requirement for an AC technician to service and repair home air conditioners.",
            "Appliance repair technician required to fix washing machines and refrigerators."
        ],
        ta: [
            "வீட்டு வயரிங் மற்றும் விளக்குகள்/விசிறிகள் நிறுவ எலக்ட்ரீசியன் தேவை. முன் அனுபவம் இருக்க வேண்டும்.",
            "வீட்டு ஏசிகளை சர்வீஸ் மற்றும் பழுதுபார்க்க ஏசி டெக்னிஷியன் அவசரமாக தேவை.",
            "சலவை இயந்திரங்கள் மற்றும் குளிர்சாதன பெட்டிகளை பழுதுபார்க்க சாதன பழுதுபார்க்கும் தொழில்நுட்ப வல்லுநர் தேவை."
        ]
    },
    plumbing: {
        en: [
            "Plumber needed to fix water leakage, pipe fittings, and bathroom sanitary installations.",
            "Required pipe fitter for laying water lines and installing water taps/pumps.",
            "Borewell helper needed to assist in new borewell drilling and pump fitting."
        ],
        ta: [
            "தண்ணீர் கசிவு, குழாய் பொருத்துதல் மற்றும் குளியலறை சுகாதார நிறுவல்களை சரிசெய்ய பிளம்பர் தேவை.",
            "தண்ணீர் குழாய்கள் மற்றும் குழாய்கள்/பம்புகள் நிறுவ பைப் பிட்டர் தேவை.",
            "புதிய போர்வெல் துளையிடுதல் மற்றும் பம்ப் பொருத்துதலுக்கு உதவ போர்வெல் உதவியாளர் தேவை."
        ]
    },
    painting: {
        en: [
            "Wall painters needed for interior and exterior house painting. Putty and primer work included.",
            "Experienced texture painter required for decorative wall designs in office lobby.",
            "Helper needed to clean walls and assist painters with equipment."
        ],
        ta: [
            "வீட்டின் உட்புறம் மற்றும் வெளிப்புற பெயிண்டிங் வேலைக்கு சுவர் பெயிண்டர்கள் தேவை. புட்டி மற்றும் பிரைமர் வேலைகள் அடங்கும்.",
            "அலுவலகத்தில் அலங்கார சுவர்வடிவமைப்புகளுக்கு அனுபவம் வாய்ந்த டெக்ஸ்சர் பெயிண்டர் தேவை.",
            "சுவர்களை சுத்தம் செய்யவும், பெயிண்டர்களுக்கு உதவவும் உதவியாளர் தேவை."
        ]
    },
    carpentry: {
        en: [
            "Carpenter needed for custom wooden door, window fitting, and repairs.",
            "Furniture maker required to design and assemble modular kitchen cabinets and wooden wardrobes.",
            "Wood polisher needed to polish dining table and doors. Materials will be provided."
        ],
        ta: [
            "மரக் கதவு, ஜன்னல் பொருத்துதல் மற்றும் பழுதுபார்க்கும் பணிகளுக்கு தச்சர் தேவை.",
            "மாடுலர் கிச்சன் கேபினட்டுகள் மற்றும் மர அலமாரிகளை வடிவமைத்து அசெம்பிள் செய்ய தச்சர் தேவை.",
            "டைனிங் டேபிள் மற்றும் கதவுகளை பாலிஷ் செய்ய வுட் பாலிஷர் தேவை. பொருட்கள் வழங்கப்படும்."
        ]
    },
    masonry: {
        en: [
            "Tile worker needed for bathroom and kitchen wall/floor tile laying work.",
            "Experienced stone mason required for building compound walls with granite/stone.",
            "Marble polisher required for polishing living room floors to a high shine."
        ],
        ta: [
            "குளியலறை மற்றும் சமையலறை சுவர்/தரை ஓடுகள் பதிக்கும் வேலைக்கு டைல்ஸ் ஒட்டும் தொழிலாளி தேவை.",
            "கிரானைட்/கற்கள் கொண்டு கூட்டுச் சுவர்கள் கட்ட அனுபவம் வாய்ந்த கல் கொத்தனார் தேவை.",
            "வரவேற்பறை தரையை பளபளப்பாக பாலிஷ் செய்ய மார்பிள் பாலிஷர் தேவை."
        ]
    },
    welding: {
        en: [
            "Welder needed for fabricating window grilles, iron gates, and structural steel work.",
            "Experienced fabricator required to build metal sheds and outdoor roofing supports.",
            "Assistant helper needed to assist welder in metal cutting and grinding."
        ],
        ta: [
            "ஜன்னல் கிரில்ஸ், இரும்பு கதவுகள் மற்றும் எஃகு வேலைகளை உருவாக்க வெல்டர் தேவை.",
            "மெட்டல் ஷெட்கள் மற்றும் வெளிப்புற கூரை ஆதரவை உருவாக்க அனுபவமுள்ள மெட்டல் ஃபேப்ரிகேட்டர் தேவை.",
            "உலோகத்தை வெட்டுவதிலும் அரைப்பதிலும் வெல்டருக்கு உதவ உதவியாளர் தேவை."
        ]
    },
    agriculture: {
        en: [
            "Farm workers needed for harvesting paddy crops, weeding, and watering fields.",
            "Tractor driver required with valid license for plowing agricultural land.",
            "Helpers required for sorting, packing, and loading harvested vegetables into trucks."
        ],
        ta: [
            "நெல் அறுவடை, களை எடுத்தல் மற்றும் வயல்களுக்கு நீர் பாய்ச்ச விவசாய தொழிலாளர்கள் தேவை.",
            "விவசாய நிலத்தை உழுவதற்கு தகுதியான உரிமத்துடன் டிராக்டர் ஓட்டுநர் தேவை.",
            "அறுவடை செய்யப்பட்ட காய்கறிகளை தரம் பிரிக்க, பேக் செய்ய மற்றும் லாரிகளில் ஏற்ற உதவியாளர்கள் தேவை."
        ]
    },
    gardening: {
        en: [
            "Gardener needed for regular lawn mowing, plant pruning, and garden maintenance.",
            "Landscaper required to design backyard garden and plant flowering shrubs.",
            "Tree cutter needed to trim overgrown tree branches safely. Equipment required."
        ],
        ta: [
            "வழக்கமான புல்வெளி வெட்டுதல், செடிகளை கத்தரித்தல் மற்றும் தோட்ட பராமரிப்புக்கு தோட்டக்காரர் தேவை.",
            "தோட்டத்தை வடிவமைக்கவும், பூச்செடிகளை நடவும் லேண்ட்ஸ்கேப் செய்பவர் தேவை.",
            "வழக்கேறிய மரக் கிளைகளை பாதுகாப்பாக வெட்ட ஆள் தேவை. கருவிகள் வைத்திருக்க வேண்டும்."
        ]
    },
    transport: {
        en: [
            "Experienced commercial vehicle driver needed for local goods transportation.",
            "Loaders required for loading and unloading heavy boxes and furniture during house shifting.",
            "Packers and movers needed to carefully pack household items and load them onto transit trucks."
        ],
        ta: [
            "உள்ளூர் பொருட்கள் போக்குவரத்துக்கு அனுபவம் வாய்ந்த வணிக வாகன ஓட்டுநர் தேவை.",
            "வீடு மாற்றும்போது கனமான பெட்டிகள் மற்றும் தளபாடங்களை ஏற்ற மற்றும் இறக்க ஆட்கள் தேவை.",
            "வீட்டு உபயோகப் பொருட்களை கவனமாக பேக் செய்து லாரிகளில் ஏற்ற ஆட்கள் தேவை."
        ]
    },
    factory: {
        en: [
            "Machine operators needed for assembly line production in manufacturing unit.",
            "Quality checker required to inspect finished goods and verify packaging standards.",
            "Packing workers needed for wrapping, labeling, and boxing products for shipment."
        ],
        ta: [
            "உற்பத்தி பிரிவில் அசெம்பிளி லைன் தயாரிப்புக்கு இயந்திர ஆபரேட்டர்கள் தேவை.",
            "முடிவுற்ற பொருட்களை பரிசோதிக்க மற்றும் பேக்கேஜிங் தரங்களை சரிபார்க்க தர சோதனையாளர் தேவை.",
            "தயாரிப்புகளை ரேப்பிங், லேபிளிங் மற்றும் பாக்ஸிங் செய்ய பேக்கிங் தொழிலாளர்கள் தேவை."
        ]
    },
    housekeeping: {
        en: [
            "House maid required for daily cleaning, dusting, sweeping, and washing utensils.",
            "Deep cleaner needed for office cleaning, vacuuming, and bathroom sanitizing.",
            "Caregiver required for assisting elderly person with daily walks and medicine schedules."
        ],
        ta: [
            "தினசரி சுத்தம் செய்தல், கூட்டுதல் மற்றும் பாத்திரங்களை கழுவுவதற்கு வீட்டு வேலைக்காரி தேவை.",
            "அலுவலகத்தை சுத்தம் செய்ய, வாக்யூம் செய்ய மற்றும் குளியலறையை சுத்தம் செய்ய துப்புரவாளர் தேவை.",
            "முதியவருக்கு நடைபயிற்சி மற்றும் மருந்து அட்டவணைகளுக்கு உதவ முதியோர் பராமரிப்பாளர் தேவை."
        ]
    },
    cooking: {
        en: [
            "Home cook required to prepare healthy breakfast, lunch, and dinner for a family of four.",
            "Catering helper needed for cutting vegetables and preparing bulk orders for wedding events.",
            "Experienced chef required for a local restaurant specializing in South Indian cuisine."
        ],
        ta: [
            "நான்கு பேர் கொண்ட குடும்பத்திற்கு காலை உணவு, மதிய உணவு மற்றும் இரவு உணவு சமைக்க வீட்டு சமையல்காரர் தேவை.",
            "திருமண நிகழ்ச்சிகளுக்கு காய்கறி வெட்டவும், சமையல் வேலைகளுக்கும் உதவியாளர் தேவை.",
            "தென்னிந்திய உணவுகளில் நிபுணத்துவம் பெற்ற உள்ளூர் உணவகத்திற்கு அனுபவம் வாய்ந்த செஃப் தேவை."
        ]
    },
    security: {
        en: [
            "Security guard needed for night shift patrolling and gate management at apartment complex.",
            "Watchman required for commercial shop security. Hours: 8 PM to 8 AM.",
            "Parking attendant needed to manage vehicle entry, exit, and parking tickets at shopping mall."
        ],
        ta: [
            "அபார்ட்மெண்ட் வளாகத்தில் இரவு நேர ரோந்து மற்றும் கேட் நிர்வாகத்திற்கு பாதுகாப்பு காவலர் தேவை.",
            "வணிகக் கடை பாதுகாப்புக்கு காவலாளி தேவை. நேரம்: இரவு 8 மணி முதல் காலை 8 மணி வரை.",
            "ஷாப்பிங் மாலில் வாகனங்கள் நுழைவு, வெளியேறுதல் மற்றும் பார்க்கிங் டிக்கெட்டுகளை நிர்வகிக்க உதவியாளர் தேவை."
        ]
    },
    development: {
        en: [
            "Web developer needed to build responsive portfolio website using React.js.",
            "Data entry operator required to enter sales logs into spreadsheets. Good typing speed essential.",
            "IT support technician needed for setting up office computers and resolving network issues."
        ],
        ta: [
            "React.js பயன்படுத்தி போர்ட்ஃபோலியோ இணையதளத்தை உருவாக்க வெப் டெவலப்பர் தேவை.",
            "விற்பனை பதிவுகளை ஸ்ப்ரெட்ஷீட்டில் உள்ளிட தரவு உள்ளீட்டாளர் தேவை. தட்டச்சு வேகம் அவசியம்.",
            "அலுவலக கணினிகளை அமைக்க மற்றும் நெட்வொர்க் சிக்கல்களை தீர்க்க தகவல் தொழில்நுட்ப ஆதரவு தொழில்நுட்ப வல்லுநர் தேவை."
        ]
    },
    healthcare: {
        en: [
            "Nurse required for clinical assistance, patient checkups, and administering medication.",
            "Pharmacist needed for managing inventory and dispensing medicines at retail pharmacy.",
            "Medical assistant needed to coordinate patient appointments and manage records."
        ],
        ta: [
            "மருத்துவ உதவி, நோயாளி பரிசோதனைகள் மற்றும் மருந்துகளை வழங்க செவிலியர் தேவை.",
            "மருந்தகத்தில் மருந்துகளை நிர்வகிக்க மற்றும் வழங்க மருந்தாளுனர் தேவை.",
            "நோயாளி சந்திப்புகளை ஒருங்கிணைக்க மற்றும் பதிவுகளை நிர்வகிக்க மருத்துவ உதவியாளர் தேவை."
        ]
    },
    education: {
        en: [
            "Primary school teacher needed for teaching English and Mathematics. Class 1-5.",
            "Tutor required for home tuition for Class 10 science subjects. 2 hours daily.",
            "Summer camp counselor needed to guide children through arts, crafts, and outdoor activities."
        ],
        ta: [
            "ஆங்கிலம் மற்றும் கணிதம் கற்பிக்க ஆரம்ப பள்ளி ஆசிரியர் தேவை. வகுப்பு 1-5.",
            "10 ஆம் வகுப்பு அறிவியல் பாடங்களுக்கு வீட்டுப் பாடம் கற்பிக்க ஆசிரியர் தேவை. தினமும் 2 மணிநேரம்.",
            "கோடைகால முகாமில் குழந்தைகளுக்கு கலை, கைவினை மற்றும் வெளிப்புற செயல்பாடுகளை கற்பிக்க முகாம் ஆலோசகர் தேவை."
        ]
    },
    finance: {
        en: [
            "Accountant needed to manage billing, GST filing, and daily ledger accounting.",
            "Financial analyst required to analyze investment portfolios and prepare market reports.",
            "Tax consultant needed to help file annual income tax returns for individuals."
        ],
        ta: [
            "பில்லிங், ஜிஎஸ்டி தாக்கல் மற்றும் தினசரி பேரேடு கணக்கியலை நிர்வகிக்க கணக்காளர் தேவை.",
            "முதலீட்டு இலாகாக்களை பகுப்பாய்வு செய்ய நிதி ஆய்வாளர் தேவை.",
            "தனிநபர்களுக்கான வருடாந்திர வருமான வரி கணக்குகளை தாக்கல் செய்ய வரி ஆலோசகர் தேவை."
        ]
    },
    design: {
        en: [
            "Graphic designer needed to create social media posters, logos, and promotional banners.",
            "UI/UX designer required to design wireframes and user flows for a mobile booking application.",
            "Fashion designer needed to assist with boutique apparel patterns and clothing sketches."
        ],
        ta: [
            "சமூக ஊடக சுவரொட்டிகள், லோகோக்கள் மற்றும் விளம்பர பேனர்களை உருவாக்க கிராபிக்ஸ் வடிவமைப்பாளர் தேவை.",
            "மொபைல் புக்கிங் செயலிக்கான வயர்ஃப்ரேம்கள் மற்றும் பயனர் ஓட்டங்களை வடிவமைக்க UI/UX வடிவமைப்பாளர் தேவை.",
            "பூட்டிக் ஆடைகளின் வடிவங்கள் மற்றும் ஆடை வரைபடங்களுக்கு உதவ ஃபேஷன் டிசைனர் தேவை."
        ]
    },
    retail: {
        en: [
            "Sales associate needed to welcome customers, answer product queries, and handle sales.",
            "Cashier required for billing counter at retail grocery store. Basic math skills needed.",
            "Store manager needed to oversee daily operations, staff scheduling, and inventory counts."
        ],
        ta: [
            "வாடிக்கையாளர்களை வரவேற்க, தயாரிப்பு கேள்விகளுக்கு பதிலளிக்க மற்றும் விற்பனையை கையாள விற்பனை உதவியாளர் தேவை.",
            "மளிகைக் கடையில் பில்லிங் கவுண்டருக்கு காசாளர் தேவை. அடிப்படை கணித திறன்கள் அவசியம்.",
            "தினசரி செயல்பாடுகள், பணியாளர் அட்டவணை மற்றும் சரக்கு எண்ணிக்கையை மேற்பார்வையிட கடை மேலாளர் தேவை."
        ]
    },
    hospitality: {
        en: [
            "Waitstaff needed for taking orders and serving food to guests at a family restaurant.",
            "Front desk executive required to handle check-ins and customer queries at a boutique hotel.",
            "Barista needed for preparing specialty coffee drinks and managing counter operations."
        ],
        ta: [
            "குடும்ப உணவகத்தில் ஆர்டர்களை எடுக்கவும் விருந்தினர்களுக்கு உணவு பரிமாறவும் பரிமாறுபவர்கள் தேவை.",
            "ஹோட்டலில் செக்-இன்கள் மற்றும் வாடிக்கையாளர் கேள்விகளைக் கையாள வரவேற்பாளர் தேவை.",
            "காபி பானங்களை தயாரிக்க மற்றும் கவுண்டர் செயல்பாடுகளை நிர்வகிக்க பாரிஸ்டா தேவை."
        ]
    },
    legal: {
        en: [
            "Paralegal needed for drafting legal documents, contracts, and conducting case research.",
            "Legal advisor required to consult on corporate compliance, trademarks, and agreements.",
            "Legal assistant needed to file court documents and maintain physical/digital client files."
        ],
        ta: [
            "சட்ட ஆவணங்கள், ஒப்பந்தங்களை வரைவு செய்யவும் மற்றும் வழக்கு ஆராய்ச்சிகளை மேற்கொள்ளவும் உதவியாளர் தேவை.",
            "கார்ப்பரேட் இணக்கங்கள் மற்றும் ஒப்பந்தங்கள் குறித்து ஆலோசனை வழங்க சட்ட ஆலோசகர் தேவை.",
            "நீதிமன்ற ஆவணங்களை தாக்கல் செய்ய மற்றும் வாடிக்கையாளர் கோப்புகளை பராமரிக்க உதவியாளர் தேவை."
        ]
    },
    admin: {
        en: [
            "Virtual assistant needed to schedule appointments, manage emails, and compile weekly reports.",
            "Office assistant required to organize files, answer phone calls, and greet visitors.",
            "Data entry clerk needed for digitizing paper forms and logs into the database."
        ],
        ta: [
            "சந்திப்புகளை திட்டமிட, மின்னஞ்சல்களை நிர்வகிக்க மெய்நிகர் உதவியாளர் தேவை.",
            "கோப்புகளை ஒழுங்கமைக்க, தொலைபேசி அழைப்புகளுக்கு பதிலளிக்க அலுவலக உதவியாளர் தேவை.",
            "காகித படிவங்களை கணினியில் உள்ளிட தரவு உள்ளீட்டாளர் தேவை."
        ]
    },
    creative: {
        en: [
            "Content writer needed for writing articles, blog posts, and website landing page copy.",
            "Musician needed for background music tracking and live guitar performance at events.",
            "Freelance marketer required to manage online ad campaigns and boost local brand visibility."
        ],
        ta: [
            "கட்டுரை வரைவு, சமூக ஊடக பதிவுகள் மற்றும் இணையதள விளம்பர உள்ளடக்கங்களை எழுத எழுத்தாளர் தேவை.",
            "நிகழ்ச்சிகளில் பின்னணி இசை மற்றும் நேரடி கிட்டார் வாசிக்க இசைக்கலைஞர் தேவை.",
            "ஆன்லைன் விளம்பர பிரச்சாரங்களை நிர்வகிக்க சந்தைப்படுத்துபவர் தேவை."
        ]
    },
    other: {
        en: [
            "General helper required for loading/unloading goods, cleaning the site, and running errands.",
            "Temporary worker needed to assist with setting up booths and clean up for a 3-day exhibition.",
            "Day laborer required for miscellaneous shifting and manual tasks around the commercial property."
        ],
        ta: [
            "பொருட்களை ஏற்ற/இறக்க, தளத்தை சுத்தம் செய்ய மற்றும் இதர வேலைகளை செய்ய பொது உதவியாளர் தேவை.",
            "3 நாள் கண்காட்சிக்கான அரங்குகளை அமைக்க மற்றும் சுத்தம் செய்ய தற்காலிக ஊழியர் தேவை.",
            "வணிக சொத்துக்களை சுற்றியுள்ள இதர இடமாற்றம் மற்றும் கைமுறை பணிகளுக்கு தினசரி கூலி தொழிலாளி தேவை."
        ]
    }
};

export const categorySkills = {
    construction: [
        "Masonry",
        "Concrete Mixing",
        "Bricklaying",
        "Scaffolding",
        "Steel Fixing",
        "Heavy Lifting"
    ],
    electrical: [
        "Electrician",
        "Wireman",
        "AC Technician",
        "Appliance Repair",
        "Electrical Maintenance",
        "Solar Panel Installation",
        "Generator Repair"
    ],
    plumbing: [
        "Plumber",
        "Pipe Fitting",
        "Drain Cleaning",
        "Bathroom Installation",
        "Water Line Installation",
        "Leak Repair"
    ],
    painting: [
        "Wall Painting",
        "Spray Painting",
        "Putty Work",
        "Texture Painting",
        "Waterproofing",
        "Polishing"
    ],
    carpentry: [
        "Carpentry",
        "Furniture Making",
        "Wood Cutting",
        "Cabinet Installation",
        "Door Installation"
    ],
    welding: [
        "MIG Welding",
        "TIG Welding",
        "Arc Welding",
        "Fabrication",
        "Metal Cutting",
        "Grinding"
    ],
    agriculture: [
        "Harvesting",
        "Planting",
        "Irrigation",
        "Pesticide Spraying",
        "Tractor Driving"
    ],
    gardening: [
        "Gardening",
        "Landscaping",
        "Tree Pruning",
        "Lawn Maintenance",
        "Plant Care"
    ],
    transport: [
        "Car Driving",
        "Truck Driving",
        "Goods Delivery",
        "Loading/Unloading",
        "Forklift Operation"
    ],
    factory: [
        "Machine Operation",
        "Assembly Line",
        "Packaging",
        "Quality Inspection",
        "Warehouse Work"
    ],
    domestic: [
        "House Cleaning",
        "Cooking",
        "Laundry",
        "Babysitting",
        "Elder Care"
    ],
    housekeeping: [
        "House Cleaning",
        "Cooking",
        "Laundry",
        "Babysitting",
        "Elder Care"
    ],
    cooking: [
        "Cooking",
        "Food Preparation",
        "Baking",
        "Kitchen Helper",
        "Dishwashing"
    ],
    security: [
        "Security Guard",
        "CCTV Monitoring",
        "Patrolling",
        "Access Control",
        "Emergency Response"
    ],
    it: [
        "React",
        "JavaScript",
        "Node.js",
        "Laravel",
        "Flutter",
        "SQL"
    ],
    development: [
        "React",
        "JavaScript",
        "Node.js",
        "Laravel",
        "Flutter",
        "SQL"
    ],
    healthcare: [
        "Patient Care",
        "First Aid",
        "Nursing",
        "Phlebotomy",
        "Medical Records"
    ],
    education: [
        "Teaching",
        "Classroom Management",
        "Lesson Planning",
        "Student Assessment"
    ],
    finance: [
        "Accounting",
        "Bookkeeping",
        "Tally",
        "MS Excel",
        "Payroll"
    ],
    arts: [
        "Graphic Design",
        "Photoshop",
        "Illustrator",
        "Video Editing",
        "Photography"
    ],
    design: [
        "Graphic Design",
        "Photoshop",
        "Illustrator",
        "Video Editing",
        "Photography"
    ],
    retail: [
        "Cash Handling",
        "Customer Service",
        "POS System",
        "Sales",
        "Inventory Management"
    ],
    hospitality: [
        "Housekeeping",
        "Reception",
        "Front Office",
        "Room Service",
        "Hotel Management"
    ],
    legal: [
        "Legal Drafting",
        "Document Review",
        "Case Filing",
        "Research"
    ],
    admin: [
        "Data Entry",
        "MS Excel",
        "MS Word",
        "Typing",
        "Email Handling",
        "Document Management",
        "Computer Knowledge"
    ],
    creative: [
        "Content Writing",
        "Copywriting",
        "SEO",
        "Social Media",
        "Canva"
    ],
    others: [],
    other: []
};

