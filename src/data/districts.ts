/**
 * Complete list of all 38 Revenue Districts of Tamil Nadu (English & Tamil).
 * Maintained in a single reusable data source.
 */

export interface TamilNaduDistrict {
  id: string;
  nameEn: string;
  nameTa: string;
  headquarters: string;
  region: 'North' | 'Central' | 'South' | 'West';
}

export const TAMIL_NADU_DISTRICTS: TamilNaduDistrict[] = [
  { id: 'ariyalur', nameEn: 'Ariyalur', nameTa: 'அரியலூர்', headquarters: 'Ariyalur', region: 'Central' },
  { id: 'chengalpattu', nameEn: 'Chengalpattu', nameTa: 'செங்கல்பட்டு', headquarters: 'Chengalpattu', region: 'North' },
  { id: 'chennai', nameEn: 'Chennai', nameTa: 'சென்னை', headquarters: 'Chennai', region: 'North' },
  { id: 'coimbatore', nameEn: 'Coimbatore', nameTa: 'கோயம்புத்தூர்', headquarters: 'Coimbatore', region: 'West' },
  { id: 'cuddalore', nameEn: 'Cuddalore', nameTa: 'கடலூர்', headquarters: 'Cuddalore', region: 'Central' },
  { id: 'dharmapuri', nameEn: 'Dharmapuri', nameTa: 'தருமபுரி', headquarters: 'Dharmapuri', region: 'West' },
  { id: 'dindigul', nameEn: 'Dindigul', nameTa: 'திண்டுக்கல்', headquarters: 'Dindigul', region: 'South' },
  { id: 'erode', nameEn: 'Erode', nameTa: 'ஈரோடு', headquarters: 'Erode', region: 'West' },
  { id: 'kallakurichi', nameEn: 'Kallakurichi', nameTa: 'கள்ளக்குறிச்சி', headquarters: 'Kallakurichi', region: 'Central' },
  { id: 'kanchipuram', nameEn: 'Kanchipuram', nameTa: 'காஞ்சிபுரம்', headquarters: 'Kanchipuram', region: 'North' },
  { id: 'kanyakumari', nameEn: 'Kanyakumari', nameTa: 'கன்னியாகுமரி', headquarters: 'Nagercoil', region: 'South' },
  { id: 'karur', nameEn: 'Karur', nameTa: 'கரூர்', headquarters: 'Karur', region: 'Central' },
  { id: 'krishnagiri', nameEn: 'Krishnagiri', nameTa: 'கிருஷ்ணகிரி', headquarters: 'Krishnagiri', region: 'West' },
  { id: 'madurai', nameEn: 'Madurai', nameTa: 'மதுரை', headquarters: 'Madurai', region: 'South' },
  { id: 'mayiladuthurai', nameEn: 'Mayiladuthurai', nameTa: 'மயிலாடுதுறை', headquarters: 'Mayiladuthurai', region: 'Central' },
  { id: 'nagapattinam', nameEn: 'Nagapattinam', nameTa: 'நாகப்பட்டினம்', headquarters: 'Nagapattinam', region: 'Central' },
  { id: 'namakkal', nameEn: 'Namakkal', nameTa: 'நாமக்கல்', headquarters: 'Namakkal', region: 'West' },
  { id: 'nilgiris', nameEn: 'Nilgiris', nameTa: 'நீலகிரி', headquarters: 'Udhagamandalam', region: 'West' },
  { id: 'perambalur', nameEn: 'Perambalur', nameTa: 'பெரம்பலூர்', headquarters: 'Perambalur', region: 'Central' },
  { id: 'pudukkottai', nameEn: 'Pudukkottai', nameTa: 'புதுக்கோட்டை', headquarters: 'Pudukkottai', region: 'Central' },
  { id: 'ramanathapuram', nameEn: 'Ramanathapuram', nameTa: 'இராமநாதபுரம்', headquarters: 'Ramanathapuram', region: 'South' },
  { id: 'ranipet', nameEn: 'Ranipet', nameTa: 'இராணிப்பேட்டை', headquarters: 'Ranipet', region: 'North' },
  { id: 'salem', nameEn: 'Salem', nameTa: 'சேலம்', headquarters: 'Salem', region: 'West' },
  { id: 'sivaganga', nameEn: 'Sivaganga', nameTa: 'சிவகங்கை', headquarters: 'Sivaganga', region: 'South' },
  { id: 'tenkasi', nameEn: 'Tenkasi', nameTa: 'தென்காசி', headquarters: 'Tenkasi', region: 'South' },
  { id: 'thanjavur', nameEn: 'Thanjavur', nameTa: 'தஞ்சாவூர்', headquarters: 'Thanjavur', region: 'Central' },
  { id: 'theni', nameEn: 'Theni', nameTa: 'தேனி', headquarters: 'Theni', region: 'South' },
  { id: 'thoothukudi', nameEn: 'Thoothukudi', nameTa: 'தூத்துக்குடி', headquarters: 'Thoothukudi', region: 'South' },
  { id: 'tiruchirappalli', nameEn: 'Tiruchirappalli', nameTa: 'திருச்சிராப்பள்ளி', headquarters: 'Tiruchirappalli', region: 'Central' },
  { id: 'tirunelveli', nameEn: 'Tirunelveli', nameTa: 'திருநெல்வேலி', headquarters: 'Tirunelveli', region: 'South' },
  { id: 'tirupathur', nameEn: 'Tirupathur', nameTa: 'திருப்பத்தூர்', headquarters: 'Tirupathur', region: 'North' },
  { id: 'tiruppur', nameEn: 'Tiruppur', nameTa: 'திருப்பூர்', headquarters: 'Tiruppur', region: 'West' },
  { id: 'tiruvallur', nameEn: 'Tiruvallur', nameTa: 'திருவள்ளூர்', headquarters: 'Tiruvallur', region: 'North' },
  { id: 'tiruvannamalai', nameEn: 'Tiruvannamalai', nameTa: 'திருவண்ணாமலை', headquarters: 'Tiruvannamalai', region: 'North' },
  { id: 'tiruvarur', nameEn: 'Tiruvarur', nameTa: 'திருவாரூர்', headquarters: 'Tiruvarur', region: 'Central' },
  { id: 'vellore', nameEn: 'Vellore', nameTa: 'வேலூர்', headquarters: 'Vellore', region: 'North' },
  { id: 'viluppuram', nameEn: 'Viluppuram', nameTa: 'விழுப்புரம்', headquarters: 'Viluppuram', region: 'Central' },
  { id: 'virudhunagar', nameEn: 'Virudhunagar', nameTa: 'விருதுநகர்', headquarters: 'Virudhunagar', region: 'South' },
];

export const TN_DISTRICT_NAMES: string[] = TAMIL_NADU_DISTRICTS.map((d) => d.nameEn);

export function isValidTamilNaduDistrict(districtName: string): boolean {
  if (!districtName) return false;
  const normalized = districtName.trim().toLowerCase();
  return TAMIL_NADU_DISTRICTS.some(
    (d) => d.nameEn.toLowerCase() === normalized || d.nameTa === districtName.trim()
  );
}

export function getDistrictDisplayName(districtName: string, lang: 'en' | 'ta' = 'en'): string {
  const match = TAMIL_NADU_DISTRICTS.find(
    (d) => d.nameEn.toLowerCase() === districtName?.toLowerCase() || d.nameTa === districtName
  );
  if (!match) return districtName;
  return lang === 'ta' ? `${match.nameTa} (${match.nameEn})` : match.nameEn;
}
