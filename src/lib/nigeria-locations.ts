export const NIGERIA_LOCATIONS: Record<string, string[]> = {
  'Abia': ['Umuahia', 'Aba', 'Ohafia', 'Arochukwu', 'Isiala Ngwa'],
  'Adamawa': ['Yola', 'Jimeta', 'Mubi', 'Numan', 'Ganye'],
  'Akwa Ibom': ['Uyo', 'Eket', 'Ikot Ekpene', 'Oron', 'Abak'],
  'Anambra': ['Awka', 'Onitsha', 'Nnewi', 'Ekwulobia', 'Aguata'],
  'Bauchi': ['Bauchi', 'Azare', 'Misau', 'Jama’are', 'Ningi'],
  'Bayelsa': ['Yenagoa', 'Brass', 'Sagbama', 'Ogbia', 'Nembe'],
  'Benue': ['Makurdi', 'Gboko', 'Otukpo', 'Katsina-Ala', 'Vandeikya'],
  'Borno': ['Maiduguri', 'Biu', 'Bama', 'Dikwa', 'Konduga'],
  'Cross River': ['Calabar', 'Ikom', 'Ogoja', 'Ugep', 'Obudu'],
  'Delta': ['Asaba', 'Warri', 'Sapele', 'Ughelli', 'Agbor'],
  'Ebonyi': ['Abakaliki', 'Afikpo', 'Onueke', 'Ezza', 'Ishieke'],
  'Edo': ['Benin City', 'Auchi', 'Ekpoma', 'Uromi', 'Igarra'],
  'Ekiti': ['Ado-Ekiti', 'Ikere-Ekiti', 'Oye-Ekiti', 'Ijero-Ekiti', 'Efon-Alaaye'],
  'Enugu': ['Enugu', 'Nsukka', 'Oji River', 'Awgu', 'Agbani'],
  'FCT (Abuja)': ['Abuja', 'Gwagwalada', 'Kuje', 'Bwari', 'Kubwa', 'Lugbe'],
  'Gombe': ['Gombe', 'Kumo', 'Billiri', 'Dukku', 'Kaltungo'],
  'Imo': ['Owerri', 'Orlu', 'Okigwe', 'Mbaise', 'Oguta'],
  'Jigawa': ['Dutse', 'Hadejia', 'Gumel', 'Birnin Kudu', 'Kazaure'],
  'Kaduna': ['Kaduna', 'Zaria', 'Kafanchan', 'Soba', 'Sabon Gari'],
  'Kano': ['Kano', 'Wudil', 'Gwarzo', 'Rano', 'Bichi'],
  'Katsina': ['Katsina', 'Funtua', 'Daura', 'Malumfashi', 'Kankia'],
  'Kebbi': ['Birnin Kebbi', 'Argungu', 'Yauri', 'Zuru', 'Jega'],
  'Kogi': ['Lokoja', 'Okene', 'Kabba', 'Idah', 'Ankpa'],
  'Kwara': ['Ilorin', 'Offa', 'Omu-Aran', 'Lafiagi', 'Patigi'],
  'Lagos': ['Lagos Island', 'Ikeja', 'Lekki', 'Ajah', 'Surulere', 'Yaba', 'Ikorodu', 'Badagry', 'Epe', 'Victoria Island', 'Apapa', 'Agege'],
  'Nasarawa': ['Lafia', 'Akwanga', 'Keffi', 'Doma', 'Wamba'],
  'Niger': ['Minna', 'Bida', 'Kontagora', 'Suleja', 'New Bussa'],
  'Ogun': ['Abeokuta', 'Sagamu', 'Ijebu Ode', 'Ota', 'Ifo'],
  'Ondo': ['Akure', 'Ondo City', 'Owo', 'Ikare', 'Okitipupa'],
  'Osun': ['Osogbo', 'Ile-Ife', 'Ilesa', 'Ede', 'Iwo'],
  'Oyo': ['Ibadan', 'Ogbomoso', 'Oyo Town', 'Iseyin', 'Saki'],
  'Plateau': ['Jos', 'Bukuru', 'Pankshin', 'Shendam', 'Langtang'],
  'Rivers': ['Port Harcourt', 'Obio-Akpor', 'Bonny', 'Eleme', 'Ahoada'],
  'Sokoto': ['Sokoto', 'Tambuwal', 'Wurno', 'Gwadabawa', 'Illela'],
  'Taraba': ['Jalingo', 'Wukari', 'Bali', 'Gembu', 'Takum'],
  'Yobe': ['Damaturu', 'Potiskum', 'Nguru', 'Gashua', 'Buni Yadi'],
  'Zamfara': ['Gusau', 'Kaura Namoda', 'Talata Mafara', 'Anka', 'Maru'],
}

export const NIGERIAN_STATES = Object.keys(NIGERIA_LOCATIONS)

export function citiesForState(state: string): string[] {
  return NIGERIA_LOCATIONS[state] || []
}

/** Fuzzy-match a free-text state name (e.g. from reverse-geocoding) to a canonical state. */
export function matchState(raw: string): string | null {
  if (!raw) return null
  const norm = raw.toLowerCase().replace(/state|federal capital territory/gi, '').trim()
  for (const state of NIGERIAN_STATES) {
    const stateNorm = state.toLowerCase().replace(/\(abuja\)/gi, '').trim()
    if (stateNorm.includes(norm) || norm.includes(stateNorm)) return state
  }
  if (/abuja|fct/i.test(raw)) return 'FCT (Abuja)'
  return null
}

/** Fuzzy-match a free-text city within a (possibly unknown) state. */
export function matchCity(raw: string, state?: string | null): string | null {
  if (!raw) return null
  const norm = raw.toLowerCase().trim()
  const pool = state ? citiesForState(state) : NIGERIAN_STATES.flatMap(s => NIGERIA_LOCATIONS[s])
  for (const city of pool) {
    const cityNorm = city.toLowerCase()
    if (cityNorm.includes(norm) || norm.includes(cityNorm)) return city
  }
  return null
}
