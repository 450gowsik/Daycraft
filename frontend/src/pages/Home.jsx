import { Link } from 'react-router-dom'
import { useJobs } from '../context/JobContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useLanguage } from '../context/LanguageContext.jsx'
import { useState, useEffect } from 'react'
import LocationModal from '../components/common/LocationModal.jsx'
import {
    FiArrowRight,
    FiBriefcase,
    FiCheckCircle,
    FiDollarSign,
    FiMapPin,
    FiMessageCircle,
    FiSearch,
    FiShield,
    FiStar,
    FiUserPlus,
    FiUsers
} from 'react-icons/fi'
import { buildApiUrl } from '../services/apiConfig'
import './Home.css'
const tnDistrictsData = [
    { name: { en: 'Chennai', ta: 'சென்னை' }, role: { en: 'Electrician', ta: 'மின்சார வல்லுநர்' }, author: { en: 'Kumar', ta: 'குமார்' }, text: { en: 'DayCraft is my go-to app for finding daily-wage electricians. Placed an order and got a match in 5 minutes.', ta: 'தினசரி கூலி மின்சார வல்லுநர்களைக் கண்டறிய டேக்ராஃப்ட் எனது முதன்மையான செயலி. ஆர்டர் செய்த 5 நிமிடங்களில் பொருத்தமான நபர் கிடைத்தார்.' }, rating: 5 },
    { name: { en: 'Coimbatore', ta: 'கோயம்புத்தூர்' }, role: { en: 'Plumber', ta: 'பிளம்பர்' }, author: { en: 'Selvam', ta: 'செல்வம்' }, text: { en: 'Finding plumbing work in Gandhipuram was never this easy. The transparent wage display is awesome.', ta: 'காந்திபுரத்தில் குழாய் வேலை தேடுவது இவ்வளவு எளிதாக இருந்ததில்லை. வெளிப்படையான ஊதியக் காட்சி அருமையாக உள்ளது.' }, rating: 5 },
    { name: { en: 'Madurai', ta: 'மதுரை' }, role: { en: 'Painter', ta: 'பெயிண்டர்' }, author: { en: 'Murugan', ta: 'முருகன்' }, text: { en: 'Secured a painting contract for a new house near Mattuthavani. Highly reliable and direct.', ta: 'மாட்டுத்தாவணி அருகே ஒரு புதிய வீட்டிற்கு வண்ணம் பூசும் ஒப்பந்தத்தைப் பெற்றேன். மிகவும் நம்பகமானது மற்றும் நேரடியானது.' }, rating: 5 },
    { name: { en: 'Tiruchirappalli', ta: 'திருச்சிராப்பள்ளி' }, role: { en: 'Contractor', ta: 'ஒப்பந்தக்காரர்' }, author: { en: 'Anbarasan', ta: 'அன்பரசன்' }, text: { en: 'Hired 5 skilled helpers for agricultural unloading. Very efficient process and clear communication.', ta: 'விவசாய இறக்குமதி வேலைக்காக 5 திறமையான உதவியாளர்களைப் பணியமர்த்தினேன். மிகச் சிறந்த செயல்முறை மற்றும் தெளிவான தொடர்பு.' }, rating: 5 },
    { name: { en: 'Salem', ta: 'சேலம்' }, role: { en: 'Carpenter', ta: 'தச்சர்' }, author: { en: 'Karthik', ta: 'கார்த்திக்' }, text: { en: 'As a carpenter, I used to wait at junctions for daily jobs. Now I get booked from home.', ta: 'ஒரு தச்சராக, நான் தினசரி வேலைகளுக்காக சந்திப்புகளில் காத்திருப்பேன். இப்போது நான் வீட்டிலிருந்தே வேலை பெறுகிறேன்.' }, rating: 5 },
    { name: { en: 'Tiruppur', ta: 'திருப்பூர்' }, role: { en: 'Textile Owner', ta: 'ஜவுளி கடை உரிமையாளர்' }, author: { en: 'Prakash', ta: 'பிரகாஷ்' }, text: { en: 'Superb app for booking tailoring assistants and loaders for my textile unit. Saved me so much time.', ta: 'எனது ஜவுளி பிரிவிற்கு தையல் உதவியாளர்கள் மற்றும் சுமை தூக்குபவர்களைப் பதிவு செய்ய சிறந்த செயலி. எனது நேரத்தை மிச்சப்படுத்தியது.' }, rating: 5 },
    { name: { en: 'Erode', ta: 'ஈரோடு' }, role: { en: 'Loader', ta: 'சுமை தூக்குபவர்' }, author: { en: 'Arul', ta: 'அருள்' }, text: { en: 'Found steady loading work at the Erode market. Payment via secure escrow is safe and verified.', ta: 'ஈரோடு சந்தையில் நிலையான சுமை தூக்கும் வேலையைக் கண்டேன். பாதுகாப்பான எஸ்க்ரோ மூலம் பணம் செலுத்துவது பாதுகாப்பானது மற்றும் சரிபார்க்கப்பட்டது.' }, rating: 5 },
    { name: { en: 'Vellore', ta: 'வேலூர்' }, role: { en: 'Homeowner', ta: 'வீட்டு உரிமையாளர்' }, author: { en: 'Deepa', ta: 'தீபா' }, text: { en: 'Used DayCraft to hire a home cleaner. The worker profile verification gave us peace of mind.', ta: 'வீட்டை சுத்தம் செய்ய ஒருவரை நியமிக்க டேக்ராஃப்ட்டைப் பயன்படுத்தினேன். தொழிலாளர் சுயவிவர சரிபார்ப்பு எங்களுக்கு நிம்மதியை அளித்தது.' }, rating: 5 },
    { name: { en: 'Thoothukudi', ta: 'தூத்துக்குடி' }, role: { en: 'Loader', ta: 'சுமை தூக்குபவர்' }, author: { en: 'Muthu', ta: 'முத்து' }, text: { en: 'Secured cargo loading jobs at the port. Wages are paid directly to my wallet without middleman cuts.', ta: 'துறைமுகத்தில் சரக்கு ஏற்றுமதி வேலைகளைப் பெற்றேன். இடைத்தரகர் கமிஷன் இல்லாமல் ஊதியம் நேரடியாக எனது பணப்பைக்கு செலுத்தப்படுகிறது.' }, rating: 5 },
    { name: { en: 'Tirunelveli', ta: 'திருநெல்வேலி' }, role: { en: 'Masonry Contractor', ta: 'கொத்தனார் ஒப்பந்தக்காரர்' }, author: { en: 'Balan', ta: 'பாலன்' }, text: { en: 'Hired helpers for stone masonry. Excellent, verified profiles and quick responses.', ta: 'கல் கொத்து வேலைக்கு உதவியாளர்களை நியமித்தேன். சிறந்த, சரிபார்க்கப்பட்ட சுயவிவரங்கள் மற்றும் விரைவான பதில்கள்.' }, rating: 5 },
    { name: { en: 'Kanchipuram', ta: 'காஞ்சிபுரம்' }, role: { en: 'Weaving Unit', ta: 'நெசவுப் பிரிவு' }, author: { en: 'Srinivasan', ta: 'சீனிவாசன்' }, text: { en: 'Found silk weaving assistants easily. Very helpful for local cottage industry artisans.', ta: 'பட்டு நெசவு உதவியாளர்களை எளிதாகக் கண்டேன். உள்ளூர் குடிசைத் தொழில் கலைஞர்களுக்கு மிகவும் உதவியாக இருக்கிறது.' }, rating: 5 },
    { name: { en: 'Tiruvallur', ta: 'திருவள்ளூர்' }, role: { en: 'Helper', ta: 'உதவியாளர்' }, author: { en: 'Rajan', ta: 'ராஜன்' }, text: { en: 'Got an industrial cleaning gig near Sriperumbudur. Reliable daily pay with no delays.', ta: 'ஸ்ரீபெரும்புதூர் அருகே ஒரு தொழில்துறை துப்புரவு வேலையைப் பெற்றேன். தாமதமில்லாத நம்பகமான தினசரி ஊதியம்.' }, rating: 5 },
    { name: { en: 'Cuddalore', ta: 'கடலூர்' }, role: { en: 'Landowner', ta: 'நில உரிமையாளர்' }, author: { en: 'Ramalingam', ta: 'ராமலிங்கம்' }, text: { en: 'Found agricultural workers for harvest season in Chidambaram. Great local reach.', ta: 'சிதம்பரத்தில் அறுவடை காலத்திற்கான விவசாயத் தொழிலாளர்களைக் கண்டேன். சிறந்த உள்ளூர் அணுகல்.' }, rating: 5 },
    { name: { en: 'Thanjavur', ta: 'தஞ்சாவூர்' }, role: { en: 'Temple Painter', ta: 'கோயில் பெயிண்டர்' }, author: { en: 'Subramani', ta: 'சுப்பிரமணி' }, text: { en: 'Great platform. Found painting jobs for temple festival preparations. Highly recommended.', ta: 'சிறந்த தளம். கோயில் திருவிழா தயாரிப்புகளுக்கான வண்ணம் பூசும் வேலைகளைக் கண்டேன். மிகவும் பரிந்துரிக்கப்படுகிறது.' }, rating: 5 },
    { name: { en: 'Dindigul', ta: 'திண்டுக்கல்' }, role: { en: 'Manufacturer', ta: 'உற்பத்தியாளர்' }, author: { en: 'Abdul', ta: 'அப்துல்' }, text: { en: 'We hired lock assembly helpers. Excellent response rate and verified workers.', ta: 'பூட்டு அசெம்பிளி உதவியாளர்களை நாங்கள் நியமித்தோம். சிறந்த பதில் விகிதம் மற்றும் சரிபார்க்கப்பட்ட தொழிலாளர்கள்.' }, rating: 5 },
    { name: { en: 'Dharmapuri', ta: 'தர்மபுரி' }, role: { en: 'Mason', ta: 'கொத்தனார்' }, author: { en: 'Siva', ta: 'சிவா' }, text: { en: 'Got masonry work near Hosur border. App is clear, easy to navigate, and bilingual.', ta: 'ஓசூர் எல்லை அருகே கொத்தனார் வேலையைப் பெற்றேன். செயலி தெளிவாகவும், எளிதாகவும் மற்றும் இருமொழிகளிலும் உள்ளது.' }, rating: 5 },
    { name: { en: 'Kanyakumari', ta: 'கன்னியாகுமரி' }, role: { en: 'Farm Owner', ta: 'பண்ணை உரிமையாளர்' }, author: { en: 'George', ta: 'ஜார்ஜ்' }, text: { en: 'Finding coconut harvesting labor is simple now. Very satisfied with the matching speed.', ta: 'தென்னை அறுவடைத் தொழிலாளர்களைக் கண்டறிவது இப்போது எளிது. பொருத்தமான நபரைத் தேர்ந்தெடுக்கும் வேகத்தில் மிகவும் திருப்தி.' }, rating: 5 },
    { name: { en: 'Krishnagiri', ta: 'கிருஷ்ணகிரி' }, role: { en: 'Orchard Worker', ta: 'பழத்தோட்ட தொழிலாளி' }, author: { en: 'Munusamy', ta: 'முனுசாமி' }, text: { en: 'I get regular bookings for mango orchard pruning jobs. Payment is instant.', ta: 'மாம்பழத் தோட்ட கத்தரித்தல் வேலைகளுக்கு எனக்கு வழக்கமான முன்பதிவுகள் கிடைக்கின்றன. பணம் செலுத்துதல் உடனடியானது.' }, rating: 5 },
    { name: { en: 'Nagapattinam', ta: 'நாகப்பட்டினம்' }, role: { en: 'Boat Owner', ta: 'படகு உரிமையாளர்' }, author: { en: 'Sekar', ta: 'சேகர்' }, text: { en: 'Found boat maintenance helpers in Nagore. Very prompt chat response and easy coordination.', ta: 'நாகூரில் படகு பராமரிப்பு உதவியாளர்களைக் கண்டேன். உடனடி அரட்டை பதில் மற்றும் எளிதான ஒருங்கிணைப்பு.' }, rating: 5 },
    { name: { en: 'Namakkal', ta: 'நாமக்கல்' }, role: { en: 'Transporter', ta: 'போக்குவரத்து தொழிலதிபர்' }, author: { en: 'Loganathan', ta: 'லோகநாதன்' }, text: { en: 'Hired truck cleaning crews for my transport depot. Quick service and fair pricing.', ta: 'எனது போக்குவரத்து பணிமனைக்காக லாரி சுத்தம் செய்யும் குழுவினரை நியமித்தேன். விரைவான சேவை மற்றும் நியாயமான விலை.' }, rating: 5 },
    { name: { en: 'Nilgiris', ta: 'நீலகிரி' }, role: { en: 'Tea Estate Helper', ta: 'தேயிலைத் தோட்ட உதவியாளர்' }, author: { en: 'Mani', ta: 'மணி' }, text: { en: 'Got tea plantation weeding work in Coonoor. Safe and reliable daily wage.', ta: 'குன்னூரில் தேயிலைத் தோட்ட களை எடுக்கும் வேலையைப் பெற்றேன். பாதுகாப்பான மற்றும் நம்பகமான தினசரி கூலி.' }, rating: 5 },
    { name: { en: 'Perambalur', ta: 'பெரம்பலூர்' }, role: { en: 'Kiln Owner', ta: 'செங்கல் சூளை உரிமையாளர்' }, author: { en: 'Karuppusamy', ta: 'கருப்புசாமி' }, text: { en: 'Hired brick kiln loaders. Verified phone numbers are really helpful to avoid fraud.', ta: 'செங்கல் சூளை சுமை தூக்குபவர்களை நியமித்தேன். ஏமாற்றுவதைத் தவிர்க்க சரிபார்க்கப்பட்ட தொலைபேசி எண்கள் மிகவும் உதவியாக உள்ளன.' }, rating: 5 },
    { name: { en: 'Pudukkottai', ta: 'புதுக்கோட்டை' }, role: { en: 'Contractor', ta: 'ஒப்பந்தக்காரர்' }, author: { en: 'Muthiah', ta: 'முத்தையா' }, text: { en: 'Found borewell drilling helpers in Alangudi. Great matching system and user experience.', ta: 'ஆலங்குடியில் ஆழ்துளை கிணறு தோண்டும் உதவியாளர்களைக் கண்டேன். சிறந்த பொருத்தம் அமைப்பு மற்றும் பயனர் அனுபவம்.' }, rating: 5 },
    { name: { en: 'Ramanathapuram', ta: 'இராமநாதபுரம்' }, role: { en: 'Fishery Helper', ta: 'மீன்வள உதவியாளர்' }, author: { en: 'Kalimuthu', ta: 'காளிமுத்து' }, text: { en: 'Got fish processing helper jobs. Wages are transparent and matches are near my area.', ta: 'மீன் பதப்படுத்தும் உதவியாளர் வேலைகளைப் பெற்றேன். ஊதியம் வெளிப்படையானது மற்றும் என் பகுதிக்கு அருகில் உள்ளது.' }, rating: 5 },
    { name: { en: 'Sivaganga', ta: 'சிவகங்கை' }, role: { en: 'Art Dealer', ta: 'கலைப் பொருள் வியாபாரி' }, author: { en: 'Chidambaram', ta: 'சிதம்பரம்' }, text: { en: 'Hired woodcarving helpers in Karaikudi. DayCraft is an excellent product.', ta: 'காரைக்குடியில் மரச்செதுக்கு வேலை உதவியாளர்களை நியமித்தேன். டேக்ராஃப்ட் ஒரு சிறந்த தயாரிப்பு.' }, rating: 5 },
    { name: { en: 'Theni', ta: 'தேனி' }, role: { en: 'Cardamom Estate Owner', ta: 'ஏலக்காய் தோட்ட உரிமையாளர்' }, author: { en: 'Ramasamy', ta: 'ராமசாமி' }, text: { en: 'Found cardamom estate workers. Direct coordination is smooth and very fast.', ta: 'ஏலக்காய் தோட்டத் தொழிலாளர்களைக் கண்டேன். நேரடி ஒருங்கிணைப்பு தடையற்றது மற்றும் மிக வேகமானது.' }, rating: 5 },
    { name: { en: 'Tiruvannamalai', ta: 'திருவண்ணாமலை' }, role: { en: 'Painter', ta: 'பெயிண்டர்' }, author: { en: 'Palani', ta: 'பழனி' }, text: { en: 'Got painting work during Giri Valam festival. Direct call option is good.', ta: 'கிரிவல திருவிழாவின் போது பெயிண்டிங் வேலை கிடைத்தது. நேரடி அழைப்பு விருப்பம் நன்றாக உள்ளது.' }, rating: 5 },
    { name: { en: 'Tiruvarur', ta: 'திருவாரூர்' }, role: { en: 'Farmer', ta: 'விவசாயி' }, author: { en: 'Swaminathan', ta: 'சுவாமிநாதன்' }, text: { en: 'Hired paddy harvester operators. Highly recommended for seasonal farming work.', ta: 'நெல் அறுவடை இயந்திர இயக்குநர்களை நியமித்தேன். பருவகால விவசாய வேலைகளுக்கு மிகவும் பரிந்துரைக்கப்படுகிறது.' }, rating: 5 },
    { name: { en: 'Viluppuram', ta: 'விழுப்புரம்' }, role: { en: 'Loader', ta: 'சுமை தூக்குபவர்' }, author: { en: 'Veerappan', ta: 'வீரப்பன்' }, text: { en: 'Got highway construction loader jobs. Wages are transparent and paid on time.', ta: 'நெடுஞ்சாலை கட்டுமான சுமை தூக்கும் வேலைகளைப் பெற்றேன். ஊதியம் வெளிப்படையானது மற்றும் சரியான நேரத்தில் செலுத்தப்படுகிறது.' }, rating: 5 },
    { name: { en: 'Virudhunagar', ta: 'விருதுநகர்' }, role: { en: 'Factory Owner', ta: 'தொழிற்சாலை உரிமையாளர்' }, author: { en: 'Shanmugam', ta: 'சண்முகம்' }, text: { en: 'Found firecracker packing operators in Sivakasi easily. Reliable daily-wage earners.', ta: 'சிவகாரியில் பட்டாசு பேக்கிங் செய்பவர்களை எளிதாகக் கண்டேன். நம்பகமான தினசரி கூலி பெறுபவர்கள்.' }, rating: 5 },
    { name: { en: 'Tenkasi', ta: 'தென்காசி' }, role: { en: 'Caterer', ta: 'கேட்டரிங் நடத்துபவர்' }, author: { en: 'Pandian', ta: 'பாண்டியன்' }, text: { en: 'Finding catering kitchen helpers in Courtallam is quick and hassle-free now.', ta: 'குற்றாலத்தில் கேட்டரிங் சமையலறை உதவியாளர்களைக் கண்டறிவது இப்போது விரைவானது மற்றும் தொந்தரவில்லாதது.' }, rating: 5 },
    { name: { en: 'Ariyalur', ta: 'அரியலூர்' }, role: { en: 'Factory Loader', ta: 'தொழிற்சாலை சுமை தூக்குபவர்' }, author: { en: 'Kathiravel', ta: 'கதிரவேல்' }, text: { en: 'Got cement factory loading work. Highly trusted daily pay structure.', ta: 'சிமெண்ட் தொழிற்சாலை சுமை தூக்கும் வேலை கிடைத்தது. மிகவும் நம்பகமான தினசரி ஊதிய அமைப்பு.' }, rating: 5 },
    { name: { en: 'Chengalpattu', ta: 'செங்கல்பட்டு' }, role: { en: 'Logistics Manager', ta: 'தளவாட மேலாளர்' }, author: { en: 'Vignesh', ta: 'விக்னேஷ்' }, text: { en: 'Hired warehouse helpers near OMR. Excellent layout and direct communication.', ta: 'OMR அருகே கிடங்கு உதவியாளர்களை நியமித்தேன். சிறந்த வடிவமைப்பு மற்றும் நேரடித் தொடர்பு.' }, rating: 5 },
    { name: { en: 'Kallakurichi', ta: 'கள்ளக்குறிச்சி' }, role: { en: 'Agriculturist', ta: 'விவசாயி' }, author: { en: 'Periyasamy', ta: 'பெரியசாமி' }, text: { en: 'Found sugarcane cutting laborers. Direct chat helper is awesome for our farming needs.', ta: 'கரும்பு வெட்டும் தொழிலாளர்களைக் கண்டேன். எங்கள் விவசாயத் தேவைகளுக்கு நேரடி அரட்டை உதவியாளர் அருமையாக உள்ளது.' }, rating: 5 },
    { name: { en: 'Ranipet', ta: 'இராணிப்பேட்டை' }, role: { en: 'Tannery Worker', ta: 'தோல் பதனிடும் தொழிலாளி' }, author: { en: 'Elumalai', ta: 'ஏழுமலை' }, text: { en: 'Got leather tannery helper work. The Tamil translation in the app is perfect.', ta: 'தோல் பதனிடும் தொழிற்சாலை உதவியாளர் வேலை கிடைத்தது. செயலியில் உள்ள தமிழ் மொழிபெயர்ப்பு சரியானது.' }, rating: 5 },
    { name: { en: 'Tirupathur', ta: 'திருப்பத்தூர்' }, role: { en: 'Timber Depot Owner', ta: 'மரக்கிடங்கு உரிமையாளர்' }, author: { en: 'Bashir', ta: 'பஷீர்' }, text: { en: 'Hired timber moving helpers. Verified accounts prevent scam bookings.', ta: 'மரங்களை நகர்த்தும் உதவியாளர்களை நியமித்தேன். சரிபார்க்கப்பட்ட கணக்குகள் போலி முன்பதிவுகளைத் தடுக்கின்றன.' }, rating: 5 },
    { name: { en: 'Mayiladuthurai', ta: 'மயிலாடுதுறை' }, role: { en: 'Mason', ta: 'கொத்தனார்' }, author: { en: 'Viswanathan', ta: 'விஸ்வநாதன்' }, text: { en: 'Got temple restoration masonry work. Safe and direct booking via the app.', ta: 'கோயில் புனரமைப்பு கொத்தனார் வேலை கிடைத்தது. செயலி மூலம் பாதுகாப்பான மற்றும் நேரடி முன்பதிவு.' }, rating: 5 },
    { name: { en: 'Karur', ta: 'கரூர்' }, role: { en: 'Exporter', ta: 'ஏற்றுமதியாளர்' }, author: { en: 'Ranganathan', ta: 'ரங்கநாதன்' }, text: { en: 'Hired home textile loaders. Daily wage updates are transparent and reliable.', ta: 'வீட்டு ஜவுளி சுமை தூக்குபவர்களை நியமித்தேன். தினசரி கூலி புதுப்பிப்புகள் வெளிப்படையானவை மற்றும் நம்பகமானவை.' }, rating: 5 }
];

function Home() {
    const { t, language } = useLanguage()
    const { categories, selectedLocation, setSelectedLocation } = useJobs()
    const { user, isAuthenticated, isWorker, isEmployer, updateProfile } = useAuth()
    const [featuredJobs, setFeaturedJobs] = useState([])
    const [isLoadingJobs, setIsLoadingJobs] = useState(true)
    const [userLocation, setUserLocation] = useState(null)
    const [showLocationModal, setShowLocationModal] = useState(false)

    // Sync userLocation state with global selectedLocation or user.location
    useEffect(() => {
        if (selectedLocation) {
            setUserLocation(selectedLocation.displayText)
        } else if (user?.location) {
            setUserLocation(user.location)
            setSelectedLocation({
                displayText: user.location,
                source: 'user_profile'
            })
        } else {
            setUserLocation(null)
        }
    }, [selectedLocation, user, setSelectedLocation])

    const handleLocationSelect = async (loc) => {
        setSelectedLocation(loc)
        setUserLocation(loc.displayText)
        if (isAuthenticated && updateProfile) {
            try {
                await updateProfile({ location: loc.displayText })
            } catch (err) {
                console.error('Failed to update profile location:', err)
            }
        }
    }

    useEffect(() => {
        const fetchFeaturedJobs = async () => {
            setIsLoadingJobs(true)
            try {
                let url = buildApiUrl('/jobs?limit=8&status=open')

                if (userLocation) {
                    const locationParts = userLocation.split(',').map((part) => part.trim())
                    const searchLocation = locationParts[0] || userLocation
                    url += `&location=${encodeURIComponent(searchLocation)}`
                }

                const response = await fetch(url)
                const data = await response.json()

                if (data.success && data.jobs?.length) {
                    setFeaturedJobs(data.jobs.slice(0, 8))
                    return
                }

                // Fallback to demo data - filter by location!
                const demoResponse = await import('../data/demoJobs.json')
                const demoJobs = demoResponse.default || demoResponse
                
                if (userLocation) {
                    const locationParts = userLocation.split(',').map((part) => part.trim())
                    const searchLocation = locationParts[0]?.toLowerCase() || userLocation.toLowerCase()
                    const filteredDemo = demoJobs.filter(job => 
                        job.location?.toLowerCase().includes(searchLocation)
                    )
                    setFeaturedJobs(filteredDemo.slice(0, 8))
                } else {
                    setFeaturedJobs(demoJobs.slice(0, 8))
                }
            } catch (error) {
                console.error('Error fetching featured jobs:', error)
                try {
                    const demoResponse = await import('../data/demoJobs.json')
                    const demoJobs = demoResponse.default || demoResponse
                    if (userLocation) {
                        const locationParts = userLocation.split(',').map((part) => part.trim())
                        const searchLocation = locationParts[0]?.toLowerCase() || userLocation.toLowerCase()
                        const filteredDemo = demoJobs.filter(job => 
                            job.location?.toLowerCase().includes(searchLocation)
                        )
                        setFeaturedJobs(filteredDemo.slice(0, 8))
                    } else {
                        setFeaturedJobs(demoJobs.slice(0, 8))
                    }
                } catch (fallbackError) {
                    console.error('Failed to load demo jobs:', fallbackError)
                }
            } finally {
                setIsLoadingJobs(false)
            }
        }

        fetchFeaturedJobs()
    }, [userLocation])



    const displayCategories = categories.slice(0, 10)

    return (
        <div className="home-page">
            <section className="home-hero">
                <div className="container home-hero-container">
                    <div className="home-hero-copy">
                        <p className="home-eyebrow">{t('home.hero.eyebrow')}</p>
                        <h1>{t('home.hero.title')}</h1>
                        <p className="home-hero-text">
                            {t('home.hero.description')}
                        </p>

                        <div className="home-actions">
                            {(!isAuthenticated || isWorker) && (
                                <Link to="/jobs" className="btn btn-primary btn-lg">
                                    <FiSearch aria-hidden="true" />
                                    {t('home.hero.findJobs')}
                                </Link>
                            )}
                            {(!isAuthenticated || isEmployer) && (
                                <Link to="/post-job" className="btn btn-secondary btn-lg">
                                    <FiBriefcase aria-hidden="true" />
                                    {t('home.cta.postJob')}
                                </Link>
                            )}
                        </div>

                        {!isAuthenticated && (
                            <p className="home-login-note">
                                {t('home.hero.loginNote')}
                            </p>
                        )}
                    </div>

                    <div className="home-hero-panel" aria-label="DayCraft overview">
                        <div className="panel-header">
                            <div>
                                <span className="panel-kicker">{t('home.panel.kicker')}</span>
                                <h2>{t('home.panel.title')}</h2>
                            </div>
                            <FiBriefcase aria-hidden="true" />
                        </div>

                        <div className="panel-list">
                            <div 
                                className="panel-row" 
                                onClick={() => setShowLocationModal(true)}
                                style={{ cursor: 'pointer' }}
                            >
                                <FiMapPin aria-hidden="true" />
                                <div>
                                    <strong>{t('home.panel.nearbyOpenings')}</strong>
                                    <span style={{ borderBottom: '1px dashed #4F46E5', paddingBottom: '2px', display: 'inline-block' }}>
                                        {userLocation || t('home.panel.jobsAcrossTN')}
                                    </span>
                                </div>
                            </div>
                            <div className="panel-row">
                                <FiUsers aria-hidden="true" />
                                <div>
                                    <strong>{t('home.panel.skilledWorkers')}</strong>
                                    <span>{t('home.panel.categoriesDesc')}</span>
                                </div>
                            </div>
                            <div className="panel-row">
                                <FiCheckCircle aria-hidden="true" />
                                <div>
                                    <strong>{t('home.panel.clearDetails')}</strong>
                                    <span>{t('home.panel.detailsDesc')}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="home-trust">
                <div className="container home-trust-grid">
                    <span>{t('home.trust.verified')}</span>
                    <span>{t('home.trust.nearby')}</span>
                    <span>{t('home.trust.direct')}</span>
                    <span>{t('home.trust.clearPay')}</span>
                </div>
            </section>

            <section className="howto-section">
                <div className="container">
                    <div className="howto-header">
                        <span className="howto-badge">{t('home.howto.badge')}</span>
                        <h2>{t('home.howto.title')} <span className="text-gradient">DayCraft</span></h2>
                        <p>{t('home.howto.subtitle')}</p>
                    </div>

                    <div className="howto-timeline">
                        <div className="howto-step">
                            <div className="howto-step-number">
                                <span>1</span>
                            </div>
                            <div className="howto-step-content">
                                <div className="howto-step-icon-wrap">
                                    <FiUserPlus aria-hidden="true" />
                                </div>
                                <h3>{t('home.howto.step1.title')}</h3>
                                <p>
                                    {t('home.howto.step1.description')}
                                </p>
                            </div>
                        </div>

                        <div className="howto-step">
                            <div className="howto-step-number">
                                <span>2</span>
                            </div>
                            <div className="howto-step-content">
                                <div className="howto-step-icon-wrap">
                                    <FiSearch aria-hidden="true" />
                                </div>
                                <h3>{t('home.howto.step2.title')}</h3>
                                <p>
                                    {t('home.howto.step2.description')}
                                </p>
                            </div>
                        </div>

                        <div className="howto-step">
                            <div className="howto-step-number">
                                <span>3</span>
                            </div>
                            <div className="howto-step-content">
                                <div className="howto-step-icon-wrap">
                                    <FiCheckCircle aria-hidden="true" />
                                </div>
                                <h3>{t('home.howto.step3.title')}</h3>
                                <p>
                                    {t('home.howto.step3.description')}
                                </p>
                            </div>
                        </div>

                        <div className="howto-step">
                            <div className="howto-step-number">
                                <span>4</span>
                            </div>
                            <div className="howto-step-content">
                                <div className="howto-step-icon-wrap">
                                    <FiMessageCircle aria-hidden="true" />
                                </div>
                                <h3>{t('home.howto.step4.title')}</h3>
                                <p>
                                    {t('home.howto.step4.description')}
                                </p>
                            </div>
                        </div>

                        <div className="howto-step">
                            <div className="howto-step-number">
                                <span>5</span>
                            </div>
                            <div className="howto-step-content">
                                <div className="howto-step-icon-wrap">
                                    <FiDollarSign aria-hidden="true" />
                                </div>
                                <h3>{t('home.howto.step5.title')}</h3>
                                <p>
                                    {t('home.howto.step5.description')}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="home-section home-section-muted">
                <div className="container">
                    <div className="home-section-row">
                        <div>
                            <p className="home-eyebrow">
                                {userLocation ? (language === 'ta' ? `${userLocation} இல் உள்ள வேலைகள்` : `Jobs in ${userLocation}`) : t('home.jobs.openJobs')}
                            </p>
                            <h2>{userLocation ? t('home.jobs.jobsNearYou') : t('home.jobs.recentOpenings')}</h2>
                        </div>
                        <Link to="/jobs" className="home-text-link">
                            {t('home.jobs.viewAll')} <FiArrowRight aria-hidden="true" />
                        </Link>
                    </div>

                    <div className="home-jobs-grid">
                        {isLoadingJobs ? (
                            [...Array(4)].map((_, index) => (
                                <div key={index} className="home-job-card skeleton-card">
                                    <div className="skeleton-title"></div>
                                    <div className="skeleton-text"></div>
                                    <div className="skeleton-text short"></div>
                                </div>
                            ))
                        ) : featuredJobs.length > 0 ? (
                            featuredJobs.map((job) => {
                                const title = job.title?.en || job.title || 'Job opening'
                                const jobId = job._id || job.id

                                return (
                                    <Link to={`/jobs/${jobId}`} key={jobId} className="home-job-card">
                                        <div className="home-job-topline">
                                            <span>{job.category || 'General'}</span>
                                            {job.urgent && <strong>Urgent</strong>}
                                        </div>
                                        <h3>{title}</h3>
                                        <p>{job.employer?.name || 'Employer'}</p>
                                        <div className="home-job-meta">
                                            <span>{job.location || 'Location pending'}</span>
                                            <strong>Rs. {job.wage?.toLocaleString() || '--'}/day</strong>
                                        </div>
                                    </Link>
                                )
                            })
                        ) : (
                            <p className="home-empty">{t('home.jobs.empty')}</p>
                        )}
                    </div>
                </div>
            </section>

            <section className="home-section">
                <div className="container">
                    <div className="home-section-row">
                        <div>
                            <p className="home-eyebrow">{t('home.categories.title')}</p>
                            <h2>{t('home.categories.subtitle')}</h2>
                        </div>
                        <Link to="/jobs" className="home-text-link">
                            {t('home.categories.explore')} <FiArrowRight aria-hidden="true" />
                        </Link>
                    </div>

                    <div className="home-category-grid">
                        {displayCategories.map((category) => (
                            <Link
                                to={`/jobs?category=${category.id}`}
                                key={category.id}
                                className="home-category-card"
                            >
                                <span>{category.name?.[language] || category.name?.en || category.label || category.id}</span>
                                <small>{category.jobCount || 0}+ {t('home.categories.jobsSuffix')}</small>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            <section className="home-testimonials-section">
                <div className="container">
                    <div className="testimonials-header">
                        <span className="testimonials-badge">{t('home.testimonials.badge')}</span>
                        <h2>{t('home.testimonials.titlePre')} <span className="text-gradient">{t('home.testimonials.titleGrad')}</span> {t('home.testimonials.titlePost')}</h2>
                        <p>{t('home.testimonials.subtitle')}</p>
                    </div>

                    <div className="marquee-section-container">
                        
                        {/* Single Row containing all 38 districts (Right to Left) */}
                        <div className="marquee-row">
                            <div className="marquee-track" style={{ animationDuration: '90s' }}>
                                {tnDistrictsData.map((dist, idx) => {
                                    const distName = dist.name[language] || dist.name.en;
                                    const distRole = dist.role[language] || dist.role.en;
                                    const distAuthor = dist.author[language] || dist.author.en;
                                    const distText = dist.text[language] || dist.text.en;
                                    return (
                                        <div key={`m-${dist.name.en}-${idx}`} className="testimonial-marquee-card">
                                            <div className="testimonial-card-header">
                                                <div className="testimonial-quote-icon">&ldquo;</div>
                                                <div className="testimonial-rating">
                                                    {[...Array(dist.rating)].map((_, i) => (
                                                        <FiStar key={i} className="star-filled" aria-hidden="true" />
                                                    ))}
                                                </div>
                                            </div>
                                            <blockquote className="testimonial-text">
                                                {distText}
                                            </blockquote>
                                            <div className="testimonial-footer">
                                                <div className="testimonial-avatar">
                                                    {distAuthor.charAt(0)}
                                                </div>
                                                <div className="testimonial-info">
                                                    <strong>{distAuthor}</strong>
                                                    <span>{distRole} · {distName}</span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                                {/* Duplicated copy for infinite seamless loop */}
                                {tnDistrictsData.map((dist, idx) => {
                                    const distName = dist.name[language] || dist.name.en;
                                    const distRole = dist.role[language] || dist.role.en;
                                    const distAuthor = dist.author[language] || dist.author.en;
                                    const distText = dist.text[language] || dist.text.en;
                                    return (
                                        <div key={`m-dup-${dist.name.en}-${idx}`} className="testimonial-marquee-card" aria-hidden="true">
                                            <div className="testimonial-card-header">
                                                <div className="testimonial-quote-icon">&ldquo;</div>
                                                <div className="testimonial-rating">
                                                    {[...Array(dist.rating)].map((_, i) => (
                                                        <FiStar key={i} className="star-filled" aria-hidden="true" />
                                                    ))}
                                                </div>
                                            </div>
                                            <blockquote className="testimonial-text">
                                                {distText}
                                            </blockquote>
                                            <div className="testimonial-footer">
                                                <div className="testimonial-avatar">
                                                    {distAuthor.charAt(0)}
                                                </div>
                                                <div className="testimonial-info">
                                                    <strong>{distAuthor}</strong>
                                                    <span>{distRole} · {distName}</span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                    </div>
                </div>
            </section>

            <section className="home-about-section">
                <div className="container">
                    <div className="about-content">
                        <div className="about-text">
                            <span className="about-badge">{t('home.about.badge')}</span>
                            <h2>
                                {t('home.about.titlePre')} <span className="text-gradient">{t('home.about.titleGrad')}</span> {t('home.about.titlePost')}
                            </h2>
                            <p className="about-description">
                                {t('home.about.desc1')}
                            </p>
                            <p className="about-description">
                                {t('home.about.desc2')}
                            </p>
                            <Link to="/register" className="btn btn-primary btn-lg about-cta-btn">
                                {t('home.about.cta')} <FiArrowRight aria-hidden="true" />
                            </Link>
                        </div>
                        <div className="about-features-grid">
                            <div className="about-feature-card">
                                <div className="about-feature-icon-wrap">
                                    <FiShield aria-hidden="true" />
                                </div>
                                <h4>{t('home.about.feat1.title')}</h4>
                                <p>{t('home.about.feat1.desc')}</p>
                            </div>
                            <div className="about-feature-card">
                                <div className="about-feature-icon-wrap">
                                    <FiMapPin aria-hidden="true" />
                                </div>
                                <h4>{t('home.about.feat2.title')}</h4>
                                <p>{t('home.about.feat2.desc')}</p>
                            </div>
                            <div className="about-feature-card">
                                <div className="about-feature-icon-wrap">
                                    <FiBriefcase aria-hidden="true" />
                                </div>
                                <h4>{t('home.about.feat3.title')}</h4>
                                <p>{t('home.about.feat3.desc')}</p>
                            </div>
                            <div className="about-feature-card">
                                <div className="about-feature-icon-wrap">
                                    <FiCheckCircle aria-hidden="true" />
                                </div>
                                <h4>{t('home.about.feat4.title')}</h4>
                                <p>{t('home.about.feat4.desc')}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="home-cta">
                <div className="container home-cta-inner">
                    <div>
                        <p className="home-eyebrow">{t('home.cta.eyebrow')}</p>
                        <h2>{t('home.cta.title')}</h2>
                    </div>
                    <div className="home-actions">
                        {!isAuthenticated && (
                            <Link to="/register" className="btn btn-primary btn-lg">{t('home.cta.createAccount')}</Link>
                        )}
                        {(!isAuthenticated || isWorker) && isAuthenticated && (
                            <Link to="/jobs" className="btn btn-primary btn-lg">{t('home.hero.findJobs')}</Link>
                        )}
                        {(!isAuthenticated || isEmployer) && (
                            <Link to="/post-job" className="btn btn-secondary btn-lg">{t('home.cta.postJob')}</Link>
                        )}
                    </div>
                </div>
            </section>
            <LocationModal
                isOpen={showLocationModal}
                onClose={() => setShowLocationModal(false)}
                onSelect={handleLocationSelect}
                selectedLocation={selectedLocation}
            />
        </div>
    )
}

export default Home
