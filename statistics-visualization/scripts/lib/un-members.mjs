// ISO3 codes that show up in UN Data Commons "Country" place-type results but are NOT one of the
// 193 UN member states — dependent territories, special administrative regions, and states in free
// association that keep their own statistical identity. Verified against this project's fetches on
// 2026-09-25 (fertility TFR N=232, alcohol consumption N=209, heavy-episodic-drinking N=187) by
// checking every non-obvious code, not by guessing from population size — several UN member states
// are tiny Pacific/Caribbean islands and must stay IN (Nauru, Tuvalu, Kiribati, Marshall Islands,
// Micronesia, Saint Kitts and Nevis, ...).
export const NON_MEMBER_ISO3 = new Set([
  "MAF", // Saint Martin (French part)
  "VIR", // US Virgin Islands
  "BLM", // Saint Barthélemy
  "TCA", // Turks and Caicos Islands
  "CUW", // Curaçao
  "ABW", // Aruba
  "CYM", // Cayman Islands
  "BMU", // Bermuda
  "MTQ", // Martinique
  "VGB", // British Virgin Islands
  "REU", // Réunion
  "COK", // Cook Islands (free association with NZ)
  "GLP", // Guadeloupe
  "NCL", // New Caledonia
  "PYF", // French Polynesia
  "GUF", // French Guiana
  "PRI", // Puerto Rico
  "MAC", // Macao SAR, China
  "HKG", // Hong Kong SAR, China
  "SHN", // Saint Helena
  "NIU", // Niue (free association with NZ)
]);

export const isUnMember = (iso3) => !NON_MEMBER_ISO3.has(iso3);
export const filterUnMembers = (rows) => rows.filter((r) => isUnMember(r.iso3));
