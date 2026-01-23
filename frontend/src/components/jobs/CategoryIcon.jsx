import {
    FaHardHat, FaWrench, FaPaintRoller, FaTree, FaTruck, FaShieldAlt,
    FaUtensils, FaBroom, FaIndustry, FaSeedling, FaBuilding, FaCar,
    FaBolt, FaHammer, FaCubes, FaMoon, FaSun, FaParking, FaDoorOpen,
    FaWarehouse, FaCamera, FaHome, FaTint, FaSnowflake, FaBox,
    FaBaby, FaUserTie, FaCheckCircle, FaClock, FaTimesCircle, FaSyncAlt
} from 'react-icons/fa'
import { MdSecurity, MdEvent, MdLocalShipping, MdAgriculture } from 'react-icons/md'
import { GiFactory, GiBrickWall, GiAnvil } from 'react-icons/gi'
import { BsFillPersonFill } from 'react-icons/bs'

// Category icon mapping to React Icons
const CATEGORY_ICONS = {
    construction: FaHardHat,
    electrical: FaBolt,
    plumbing: FaWrench,
    painting: FaPaintRoller,
    carpentry: FaHammer,
    masonry: GiBrickWall,
    welding: GiAnvil,
    agriculture: MdAgriculture,
    gardening: FaTree,
    transport: FaTruck,
    factory: GiFactory,
    housekeeping: FaBroom,
    cooking: FaUtensils,
    security: FaShieldAlt
}

// Title-based icon mapping (more specific icons)
const TITLE_ICON_MAP = [
    { keywords: ['night watch', 'night guard', 'night shift', 'night security'], Icon: FaMoon },
    { keywords: ['day guard', 'day shift', 'day security'], Icon: FaSun },
    { keywords: ['event security', 'event', 'function'], Icon: MdEvent },
    { keywords: ['parking'], Icon: FaParking },
    { keywords: ['gate keeping', 'gate guard', 'gate'], Icon: FaDoorOpen },
    { keywords: ['office security', 'office'], Icon: FaBuilding },
    { keywords: ['building watch', 'building'], Icon: FaBuilding },
    { keywords: ['factory guard', 'factory'], Icon: GiFactory },
    { keywords: ['mall', 'shop security', 'shop', 'store'], Icon: FaWarehouse },
    { keywords: ['bank'], Icon: FaBuilding },
    { keywords: ['atm'], Icon: FaBuilding },
    { keywords: ['construction', 'mason', 'brick', 'rcc', 'concrete'], Icon: FaHardHat },
    { keywords: ['electric', 'wire', 'fan', 'light'], Icon: FaBolt },
    { keywords: ['plumb', 'pipe', 'drainage', 'water tank'], Icon: FaTint },
    { keywords: ['paint', 'texture', 'putty'], Icon: FaPaintRoller },
    { keywords: ['carpenter', 'wood', 'door', 'furniture'], Icon: FaHammer },
    { keywords: ['clean', 'maid', 'sweep', 'deep cleaning'], Icon: FaBroom },
    { keywords: ['cook', 'kitchen', 'catering', 'chef'], Icon: FaUtensils },
    { keywords: ['driver', 'taxi', 'auto', 'truck', 'van'], Icon: FaCar },
    { keywords: ['garden', 'lawn', 'landscap', 'tree'], Icon: FaTree },
    { keywords: ['delivery', 'courier'], Icon: MdLocalShipping },
    { keywords: ['babysit', 'nanny', 'child care'], Icon: FaBaby },
    { keywords: ['elder care', 'senior care', 'caregiver'], Icon: BsFillPersonFill },
    { keywords: ['warehouse', 'loading', 'godown'], Icon: FaBox },
    { keywords: ['ac ', 'air condition'], Icon: FaSnowflake },
    { keywords: ['cctv', 'camera'], Icon: FaCamera },
    { keywords: ['roof', 'waterproof'], Icon: FaHome },
    { keywords: ['tile', 'flooring', 'marble'], Icon: GiBrickWall },
    { keywords: ['weld', 'fabricat', 'grille'], Icon: GiAnvil },
    { keywords: ['security', 'guard', 'watchman', 'watch'], Icon: MdSecurity },
]

// Status icons
export const STATUS_ICONS = {
    open: FaCheckCircle,
    'in-progress': FaSyncAlt,
    completed: FaCheckCircle,
    cancelled: FaTimesCircle,
    available: FaCheckCircle,
    busy: FaClock,
    unavailable: FaTimesCircle
}

/**
 * Get Icon component based on job title and category
 */
export function getCategoryIcon(title, category) {
    // Normalize title to lowercase string
    let titleStr = ''
    if (typeof title === 'object' && title !== null) {
        titleStr = (title.en || title.ta || '').toLowerCase()
    } else if (typeof title === 'string') {
        titleStr = title.toLowerCase()
    }

    // Search for a matching keyword in title
    for (const mapping of TITLE_ICON_MAP) {
        for (const keyword of mapping.keywords) {
            if (titleStr.includes(keyword)) {
                return mapping.Icon
            }
        }
    }

    // Fallback to category icon
    return CATEGORY_ICONS[category] || FaUserTie
}

/**
 * CategoryIcon Component - renders the appropriate icon
 */
export function CategoryIcon({ title, category, size = 24, color, className = '' }) {
    const IconComponent = getCategoryIcon(title, category)

    return (
        <IconComponent
            size={size}
            color={color}
            className={`category-icon ${className}`}
            style={{ flexShrink: 0 }}
        />
    )
}

/**
 * StatusIcon Component - renders status icons
 */
export function StatusIcon({ status, size = 14, className = '' }) {
    const IconComponent = STATUS_ICONS[status] || FaCheckCircle

    const colorMap = {
        open: '#059669',
        'in-progress': '#B45309',
        completed: '#4F46E5',
        cancelled: '#DC2626',
        available: '#059669',
        busy: '#B45309',
        unavailable: '#DC2626'
    }

    return (
        <IconComponent
            size={size}
            color={colorMap[status] || '#059669'}
            className={`status-icon ${className}`}
        />
    )
}

export default CategoryIcon
