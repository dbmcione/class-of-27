import { supabase } from './supabase';

export type College = {
  id: string;
  name: string;
  /** Indian state, or null for colleges outside India. */
  state: string | null;
  /** ISO-3166 alpha-2. 'IN' for Indian colleges. */
  country: string;
};

/** Names for the country codes present in the college list. */
export const COUNTRY_NAMES: Record<string, string> = {
  AE: 'UAE',
  AF: 'Afghanistan',
  AG: 'Antigua',
  AM: 'Armenia',
  AN: 'Netherlands Antilles',
  AR: 'Argentina',
  AT: 'Austria',
  AU: 'Australia',
  AW: 'Aruba',
  AZ: 'Azerbaijan',
  BA: 'Bosnia and Herzegovina',
  BB: 'Barbados',
  BD: 'Bangladesh',
  BG: 'Bulgaria',
  BH: 'Bahrain',
  BY: 'Belarus',
  BZ: 'Belize',
  CA: 'Canada',
  CN: 'China',
  CU: 'Cuba',
  CZ: 'Czechia',
  DE: 'Germany',
  DM: 'Dominica',
  DO: 'Dominican Republic',
  EG: 'Egypt',
  ET: 'Ethiopia',
  FR: 'France',
  GD: 'Grenada',
  GE: 'Georgia',
  GY: 'Guyana',
  HR: 'Croatia',
  HU: 'Hungary',
  ID: 'Indonesia',
  IE: 'Ireland',
  IN: 'India',
  IR: 'Iran',
  IT: 'Italy',
  JM: 'Jamaica',
  KE: 'Kenya',
  KG: 'Kyrgyzstan',
  KH: 'Cambodia',
  KN: 'Saint Kitts and Nevis',
  KZ: 'Kazakhstan',
  LC: 'Saint Lucia',
  LK: 'Sri Lanka',
  LT: 'Lithuania',
  LV: 'Latvia',
  MD: 'Moldova',
  MN: 'Mongolia',
  MT: 'Malta',
  MU: 'Mauritius',
  MW: 'Malawi',
  MY: 'Malaysia',
  NG: 'Nigeria',
  NP: 'Nepal',
  NZ: 'New Zealand',
  OM: 'Oman',
  PA: 'Panama',
  PH: 'Philippines',
  PK: 'Pakistan',
  PL: 'Poland',
  RO: 'Romania',
  RU: 'Russia',
  SA: 'Saudi Arabia',
  SC: 'Seychelles',
  SD: 'Sudan',
  SG: 'Singapore',
  SK: 'Slovakia',
  TJ: 'Tajikistan',
  TZ: 'Tanzania',
  UA: 'Ukraine',
  UG: 'Uganda',
  UK: 'United Kingdom',
  US: 'United States',
  UZ: 'Uzbekistan',
  VC: 'Saint Vincent',
  WS: 'Samoa',
  YE: 'Yemen',
  ZM: 'Zambia',
};

/**
 * The line shown under a college in the dropdown: the state for Indian
 * colleges, the country for everywhere else. Foreign entries carry no state.
 */
export function collegeLocation(college: College): string | null {
  if (college.state) return college.state;
  if (college.country && college.country !== 'IN') {
    return COUNTRY_NAMES[college.country] ?? college.country;
  }
  return null;
}

/**
 * A handful of colleges so the dropdown is usable in local development before
 * Supabase is configured. Never reached once VITE_SUPABASE_URL is set — the
 * real list lives in the database and is far too long to bundle.
 */
const DEV_SAMPLE: College[] = [
  { id: 'dev-1', name: 'Bangalore Medical College and Research Institute, Bangalore', state: 'Karnataka', country: 'IN' },
  { id: 'dev-2', name: 'Kasturba Medical College, Manipal', state: 'Karnataka', country: 'IN' },
  { id: 'dev-3', name: 'Maulana Azad Medical College, New Delhi', state: 'Delhi', country: 'IN' },
];

export type CollegeFetch = { colleges: College[]; failed: boolean };

/** PostgREST caps a response (Supabase defaults to 1000), so page through. */
const PAGE = 1000;

export async function fetchColleges(): Promise<CollegeFetch> {
  if (!supabase) return { colleges: DEV_SAMPLE, failed: false };

  const all: College[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase
      .from('colleges')
      .select('id, name, state, country')
      .eq('is_active', true)
      .order('name', { ascending: true })
      .range(from, from + PAGE - 1);

    if (error) return { colleges: [], failed: true };
    if (!data || data.length === 0) break;

    all.push(...data);
    if (data.length < PAGE) break;
  }

  if (all.length === 0) return { colleges: [], failed: true };
  return { colleges: all, failed: false };
}
