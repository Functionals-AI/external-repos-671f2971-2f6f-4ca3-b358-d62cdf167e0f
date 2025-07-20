export const states = ['AK', 'AL', 'AR', 'AZ', 'CA', 'CO', 'CT', 'DC', 'DE', 'FL', 'GA', 'HI', 'IA', 'ID', 'IL', 'IN', 'KS', 'KY', 'LA', 'MA', 'MD', 'ME', 'MI', 'MN', 'MO', 'MS', 'MT', 'NC', 'ND', 'NE', 'NH', 'NJ', 'NM', 'NV', 'NY', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VA', 'VT', 'WA', 'WI', 'WV', 'WY'] as const
export const stateTimezones = ['AL', 'AZ', 'AK', 'FL', 'ID', 'IN', 'KS', 'KY', 'MI', 'NE', 'ND', 'NV', 'OR', 'SD', 'TN', 'TX']
export const stateRegex = new RegExp(`^${states.join('|')}$`, 'i')
export const stateTimezonesRegex = new RegExp(`^${stateTimezones.join('|')}$`, 'i')
export const stateDepartmentMapping = { 'AK': 6, 'AL': 7, 'AR': 5, 'AZ': 8, 'CA': 9, 'CO': 10, 'CT': 11, 'DC': 54, 'DE': 12, 'FL': 13, 'GA': 14, 'HI': 15, 'IA': 16, 'ID': 17, 'IL': 50, 'IN': 18, 'KS': 19, 'KY': 20, 'LA': 21, 'MA': 51, 'MD': 22, 'ME': 23, 'MI': 24, 'MN': 25, 'MO': 52, 'MS': 26, 'MT': 27, 'NC': 28, 'ND': 29, 'NE': 30, 'NH': 31, 'NJ': 32, 'NM': 33, 'NV': 53, 'NY': 1, 'OH': 34, 'OK': 35, 'OR': 36, 'PA': 37, 'RI': 38, 'SC': 39, 'SD': 40, 'TN': 41, 'TX': 42, 'UT': 43, 'VA': 44, 'VT': 45, 'WA': 46, 'WI': 47, 'WV': 48, 'WY': 49 }
export const timezones = ['US/Aleutian', 'US/Central', 'US/Mountain', 'America/Juneau', 'US/Pacific', 'US/Eastern', 'US/Arizona', 'US/Hawaii']
export const timezoneRegex = new RegExp(`^${timezones.join('|')}$`, 'i')

export default {
  states, stateRegex, timezones, timezoneRegex, stateTimezonesRegex, stateDepartmentMapping
}