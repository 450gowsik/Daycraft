// This is a simple static category controller as categories are usually predefined
// We can easily move this to a MongoDB collection later if needed

const categories = [
    { id: 'construction', icon: '🏗️', name: { en: 'Construction',    ta: 'கட்டுமானம்' } },
    { id: 'painting',     icon: '🎨', name: { en: 'Painting',         ta: 'வண்ணம் பூசுதல்' } },
    { id: 'plumbing',     icon: '🔧', name: { en: 'Plumbing',         ta: 'குழாய் பணி' } },
    { id: 'electrical',   icon: '⚡', name: { en: 'Electrician',       ta: 'மின்சார வேலை' } },
    { id: 'carpentry',    icon: '🪚', name: { en: 'Carpentry',         ta: 'தச்சு வேலை' } },
    { id: 'cleaning',     icon: '🧹', name: { en: 'House Work',        ta: 'வீட்டு வேலை' } },
    { id: 'gardening',    icon: '🌿', name: { en: 'Agriculture',       ta: 'விவசாயம்' } },
    { id: 'driving',      icon: '🚗', name: { en: 'Delivery / Driver', ta: 'டெலிவரி / ஓட்டுநர்' } },
    { id: 'cooking',      icon: '🍳', name: { en: 'Cooking',           ta: 'சமையல்' } },
    { id: 'security',     icon: '🛡️', name: { en: 'Security',          ta: 'பாதுகாப்பு' } },
    { id: 'development',  icon: '💻', name: { en: 'Development & IT',  ta: 'தகவல் தொழில்நுட்பம்' } },
    { id: 'other',        icon: '🛠️', name: { en: 'Other',             ta: 'மற்றவை' } },
    // Legacy aliases (jobs posted with old category IDs still appear)
    { id: 'housework',    icon: '🧹', name: { en: 'House Work',        ta: 'வீட்டு வேலை' } },
    { id: 'electrician',  icon: '⚡', name: { en: 'Electrician',       ta: 'மின்சார வேலை' } },
    { id: 'driver',       icon: '🚗', name: { en: 'Driver',            ta: 'ஓட்டுநர்' } },
    { id: 'agriculture',  icon: '🌱', name: { en: 'Agriculture',       ta: 'விவசாயம்' } },
    { id: 'delivery',     icon: '📦', name: { en: 'Delivery',          ta: 'டெலிவரி' } },
    { id: 'others',       icon: '🛠️', name: { en: 'Others',            ta: 'இதர வேலைகள்' } }
]

// @desc    Get all categories
// @route   GET /api/categories
exports.getCategories = async (req, res) => {
    res.json({
        success: true,
        count: categories.length,
        categories
    })
}

// @desc    Get single category
// @route   GET /api/categories/:id
exports.getCategory = async (req, res) => {
    const category = categories.find(c => c.id === req.params.id)

    if (!category) {
        return res.status(404).json({
            success: false,
            message: 'Category not found'
        })
    }

    res.json({
        success: true,
        category
    })
}
