// This is a simple static category controller as categories are usually predefined
// We can easily move this to a MongoDB collection later if needed

const categories = [
    { id: 'construction', icon: '🏗️', name: { en: 'Construction', ta: 'கட்டுமானம்' } },
    { id: 'painting', icon: '🎨', name: { en: 'Painting', ta: 'வண்ணம் பூசுதல்' } },
    { id: 'plumbing', icon: '🚿', name: { en: 'Plumbing', ta: 'குழாய் பணி' } },
    { id: 'electrical', icon: '⚡', name: { en: 'Electrical', ta: 'மின் பணி' } },
    { id: 'carpentry', icon: '🪚', name: { en: 'Carpentry', ta: 'தச்சு வேலை' } },
    { id: 'cleaning', icon: '🧹', name: { en: 'Cleaning', ta: 'சுத்தம் செய்தல்' } },
    { id: 'gardening', icon: '🌿', name: { en: 'Gardening', ta: 'தோட்டக்கலை' } },
    { id: 'driving', icon: '🚗', name: { en: 'Driving', ta: 'ஓட்டுநர்' } },
    { id: 'cooking', icon: '🍳', name: { en: 'Cooking', ta: 'சமையல்' } },
    { id: 'security', icon: '🛡️', name: { en: 'Security', ta: 'பாதுகாப்பு' } },
    { id: 'other', icon: '🛠️', name: { en: 'Other', ta: 'மற்றவை' } }
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
