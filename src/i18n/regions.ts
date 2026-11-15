// Countries and regions (ISO 3166-1 alpha-2). Pure, covered by `npm test`.
//
// Names come from the browser in the interface language (Intl.DisplayNames) where available,
// with these English names as the fallback. The country is a regional preference only: it never
// changes the language and never restricts anything in the app.

export const REGION_NAMES_EN: Record<string, string> = {
  AD: 'Andorra', AE: 'United Arab Emirates', AF: 'Afghanistan', AG: 'Antigua and Barbuda', AI: 'Anguilla',
  AL: 'Albania', AM: 'Armenia', AO: 'Angola', AQ: 'Antarctica', AR: 'Argentina', AS: 'American Samoa',
  AT: 'Austria', AU: 'Australia', AW: 'Aruba', AX: 'Åland Islands', AZ: 'Azerbaijan',
  BA: 'Bosnia and Herzegovina', BB: 'Barbados', BD: 'Bangladesh', BE: 'Belgium', BF: 'Burkina Faso',
  BG: 'Bulgaria', BH: 'Bahrain', BI: 'Burundi', BJ: 'Benin', BL: 'Saint Barthélemy', BM: 'Bermuda',
  BN: 'Brunei', BO: 'Bolivia', BQ: 'Caribbean Netherlands', BR: 'Brazil', BS: 'Bahamas', BT: 'Bhutan',
  BV: 'Bouvet Island', BW: 'Botswana', BY: 'Belarus', BZ: 'Belize', CA: 'Canada',
  CC: 'Cocos (Keeling) Islands', CD: 'Congo (DRC)', CF: 'Central African Republic', CG: 'Congo (Republic)',
  CH: 'Switzerland', CI: "Côte d'Ivoire", CK: 'Cook Islands', CL: 'Chile', CM: 'Cameroon', CN: 'China',
  CO: 'Colombia', CR: 'Costa Rica', CU: 'Cuba', CV: 'Cape Verde', CW: 'Curaçao', CX: 'Christmas Island',
  CY: 'Cyprus', CZ: 'Czechia', DE: 'Germany', DJ: 'Djibouti', DK: 'Denmark', DM: 'Dominica',
  DO: 'Dominican Republic', DZ: 'Algeria', EC: 'Ecuador', EE: 'Estonia', EG: 'Egypt', EH: 'Western Sahara',
  ER: 'Eritrea', ES: 'Spain', ET: 'Ethiopia', FI: 'Finland', FJ: 'Fiji', FK: 'Falkland Islands',
  FM: 'Micronesia', FO: 'Faroe Islands', FR: 'France', GA: 'Gabon', GB: 'United Kingdom', GD: 'Grenada',
  GE: 'Georgia', GF: 'French Guiana', GG: 'Guernsey', GH: 'Ghana', GI: 'Gibraltar', GL: 'Greenland',
  GM: 'Gambia', GN: 'Guinea', GP: 'Guadeloupe', GQ: 'Equatorial Guinea', GR: 'Greece',
  GS: 'South Georgia and the South Sandwich Islands', GT: 'Guatemala', GU: 'Guam', GW: 'Guinea-Bissau',
  GY: 'Guyana', HK: 'Hong Kong', HM: 'Heard Island and McDonald Islands', HN: 'Honduras', HR: 'Croatia',
  HT: 'Haiti', HU: 'Hungary', ID: 'Indonesia', IE: 'Ireland', IL: 'Israel', IM: 'Isle of Man', IN: 'India',
  IO: 'British Indian Ocean Territory', IQ: 'Iraq', IR: 'Iran', IS: 'Iceland', IT: 'Italy', JE: 'Jersey',
  JM: 'Jamaica', JO: 'Jordan', JP: 'Japan', KE: 'Kenya', KG: 'Kyrgyzstan', KH: 'Cambodia', KI: 'Kiribati',
  KM: 'Comoros', KN: 'Saint Kitts and Nevis', KP: 'North Korea', KR: 'South Korea', KW: 'Kuwait',
  KY: 'Cayman Islands', KZ: 'Kazakhstan', LA: 'Laos', LB: 'Lebanon', LC: 'Saint Lucia', LI: 'Liechtenstein',
  LK: 'Sri Lanka', LR: 'Liberia', LS: 'Lesotho', LT: 'Lithuania', LU: 'Luxembourg', LV: 'Latvia', LY: 'Libya',
  MA: 'Morocco', MC: 'Monaco', MD: 'Moldova', ME: 'Montenegro', MF: 'Saint Martin', MG: 'Madagascar',
  MH: 'Marshall Islands', MK: 'North Macedonia', ML: 'Mali', MM: 'Myanmar (Burma)', MN: 'Mongolia', MO: 'Macao',
  MP: 'Northern Mariana Islands', MQ: 'Martinique', MR: 'Mauritania', MS: 'Montserrat', MT: 'Malta',
  MU: 'Mauritius', MV: 'Maldives', MW: 'Malawi', MX: 'Mexico', MY: 'Malaysia', MZ: 'Mozambique', NA: 'Namibia',
  NC: 'New Caledonia', NE: 'Niger', NF: 'Norfolk Island', NG: 'Nigeria', NI: 'Nicaragua', NL: 'Netherlands',
  NO: 'Norway', NP: 'Nepal', NR: 'Nauru', NU: 'Niue', NZ: 'New Zealand', OM: 'Oman', PA: 'Panama', PE: 'Peru',
  PF: 'French Polynesia', PG: 'Papua New Guinea', PH: 'Philippines', PK: 'Pakistan', PL: 'Poland',
  PM: 'Saint Pierre and Miquelon', PN: 'Pitcairn Islands', PR: 'Puerto Rico', PS: 'Palestine', PT: 'Portugal',
  PW: 'Palau', PY: 'Paraguay', QA: 'Qatar', RE: 'Réunion', RO: 'Romania', RS: 'Serbia', RU: 'Russia',
  RW: 'Rwanda', SA: 'Saudi Arabia', SB: 'Solomon Islands', SC: 'Seychelles', SD: 'Sudan', SE: 'Sweden',
  SG: 'Singapore', SH: 'Saint Helena', SI: 'Slovenia', SJ: 'Svalbard and Jan Mayen', SK: 'Slovakia',
  SL: 'Sierra Leone', SM: 'San Marino', SN: 'Senegal', SO: 'Somalia', SR: 'Suriname', SS: 'South Sudan',
  ST: 'São Tomé and Príncipe', SV: 'El Salvador', SX: 'Sint Maarten', SY: 'Syria', SZ: 'Eswatini',
  TC: 'Turks and Caicos Islands', TD: 'Chad', TF: 'French Southern Territories', TG: 'Togo', TH: 'Thailand',
  TJ: 'Tajikistan', TK: 'Tokelau', TL: 'Timor-Leste', TM: 'Turkmenistan', TN: 'Tunisia', TO: 'Tonga',
  TR: 'Türkiye', TT: 'Trinidad and Tobago', TV: 'Tuvalu', TW: 'Taiwan', TZ: 'Tanzania', UA: 'Ukraine',
  UG: 'Uganda', UM: 'U.S. Outlying Islands', US: 'United States', UY: 'Uruguay', UZ: 'Uzbekistan',
  VA: 'Vatican City', VC: 'Saint Vincent and the Grenadines', VE: 'Venezuela', VG: 'British Virgin Islands',
  VI: 'U.S. Virgin Islands', VN: 'Vietnam', VU: 'Vanuatu', WF: 'Wallis and Futuna', WS: 'Samoa', XK: 'Kosovo',
  YE: 'Yemen', YT: 'Mayotte', ZA: 'South Africa', ZM: 'Zambia', ZW: 'Zimbabwe',
};

/** Every region code, A–Z. */
export const REGION_CODES: string[] = Object.keys(REGION_NAMES_EN).sort();

export function isRegion(value: unknown): value is string {
  return typeof value === 'string' && Object.prototype.hasOwnProperty.call(REGION_NAMES_EN, value);
}

/** The flag emoji for a region code (regional indicator letters). */
export function regionFlag(code: string): string {
  if (!/^[A-Z]{2}$/.test(code)) return '';
  return String.fromCodePoint(...[...code].map(c => 0x1f1e6 + c.charCodeAt(0) - 65));
}

/**
 * Common IANA time zones and the region they belong to: a better hint than the language tag on
 * devices set to, say, "en-US" in India. Only a hint; the person confirms or changes it.
 */
const ZONE_REGION: Record<string, string> = {
  'Asia/Kolkata': 'IN', 'Asia/Calcutta': 'IN', 'Asia/Karachi': 'PK', 'Asia/Dhaka': 'BD', 'Asia/Kathmandu': 'NP',
  'Asia/Katmandu': 'NP', 'Asia/Colombo': 'LK', 'Asia/Thimphu': 'BT', 'Indian/Maldives': 'MV', 'Asia/Dubai': 'AE',
  'Asia/Riyadh': 'SA', 'Asia/Qatar': 'QA', 'Asia/Kuwait': 'KW', 'Asia/Bahrain': 'BH', 'Asia/Muscat': 'OM',
  'Asia/Singapore': 'SG', 'Asia/Kuala_Lumpur': 'MY', 'Asia/Jakarta': 'ID', 'Asia/Manila': 'PH', 'Asia/Bangkok': 'TH',
  'Asia/Ho_Chi_Minh': 'VN', 'Asia/Saigon': 'VN', 'Asia/Hong_Kong': 'HK', 'Asia/Shanghai': 'CN', 'Asia/Taipei': 'TW',
  'Asia/Tokyo': 'JP', 'Asia/Seoul': 'KR', 'Asia/Tehran': 'IR', 'Asia/Jerusalem': 'IL', 'Europe/Istanbul': 'TR',
  'Europe/London': 'GB', 'Europe/Dublin': 'IE', 'Europe/Paris': 'FR', 'Europe/Berlin': 'DE', 'Europe/Madrid': 'ES',
  'Europe/Lisbon': 'PT', 'Europe/Rome': 'IT', 'Europe/Amsterdam': 'NL', 'Europe/Brussels': 'BE', 'Europe/Zurich': 'CH',
  'Europe/Vienna': 'AT', 'Europe/Stockholm': 'SE', 'Europe/Oslo': 'NO', 'Europe/Copenhagen': 'DK', 'Europe/Helsinki': 'FI',
  'Europe/Warsaw': 'PL', 'Europe/Prague': 'CZ', 'Europe/Athens': 'GR', 'Europe/Bucharest': 'RO', 'Europe/Kiev': 'UA',
  'Europe/Kyiv': 'UA', 'Europe/Moscow': 'RU', 'Africa/Cairo': 'EG', 'Africa/Lagos': 'NG', 'Africa/Nairobi': 'KE',
  'Africa/Johannesburg': 'ZA', 'Africa/Casablanca': 'MA', 'Australia/Sydney': 'AU', 'Australia/Melbourne': 'AU',
  'Australia/Brisbane': 'AU', 'Australia/Perth': 'AU', 'Australia/Adelaide': 'AU', 'Pacific/Auckland': 'NZ',
  'America/Toronto': 'CA', 'America/Vancouver': 'CA', 'America/Montreal': 'CA', 'America/Edmonton': 'CA',
  'America/Winnipeg': 'CA', 'America/Halifax': 'CA', 'America/Mexico_City': 'MX', 'America/Sao_Paulo': 'BR',
  'America/Argentina/Buenos_Aires': 'AR', 'America/Buenos_Aires': 'AR', 'America/Bogota': 'CO', 'America/Lima': 'PE',
  'America/Santiago': 'CL', 'America/New_York': 'US', 'America/Chicago': 'US', 'America/Denver': 'US',
  'America/Phoenix': 'US', 'America/Los_Angeles': 'US', 'America/Anchorage': 'US', 'Pacific/Honolulu': 'US',
  'America/Detroit': 'US', 'America/Indiana/Indianapolis': 'US', 'America/Boise': 'US',
};

/**
 * The region to preselect: the device's time zone when it clearly belongs to one region,
 * otherwise the region in the device's language tags ("en-GB" → GB), otherwise none.
 */
export function suggestRegion(languages: readonly string[] | undefined | null, timeZone: string | undefined | null): string | null {
  const fromZone = timeZone ? ZONE_REGION[timeZone] : undefined;
  if (fromZone && isRegion(fromZone)) return fromZone;
  for (const tag of languages ?? []) {
    const parts = String(tag).replace(/_/g, '-').split('-');
    const region = parts.slice(1).find(p => /^[A-Za-z]{2}$/.test(p))?.toUpperCase();
    if (region && isRegion(region)) return region;
  }
  return null;
}

/** Case- and accent-insensitive search text. */
export function searchKey(text: string): string {
  return text.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().trim();
}

/** Regions whose code, localised name or English name matches `query`. */
export function filterRegions(query: string, nameOf: (code: string) => string): string[] {
  const q = searchKey(query);
  if (!q) return REGION_CODES;
  return REGION_CODES.filter(code =>
    code.toLowerCase() === q ||
    searchKey(nameOf(code)).includes(q) ||
    searchKey(REGION_NAMES_EN[code]).includes(q));
}
