/**
 * Utility functions for safe pet data parsing and formatting
 * Prevents NaN, duplicate units, and malformed display values
 */

/**
 * Safely parse a numeric value, returning null if invalid
 * @param {*} val - Value to parse
 * @returns {number|null} - Parsed number or null
 */
export const safeParseInt = (val) => {
  if (val === null || val === undefined || val === '') return null;
  const num = parseInt(String(val), 10);
  return Number.isFinite(num) && num >= 0 ? num : null;
};

/**
 * Safely parse a float value, returning null if invalid
 * @param {*} val - Value to parse
 * @returns {number|null} - Parsed number or null
 */
export const safeParseFloat = (val) => {
  if (val === null || val === undefined || val === '') return null;
  const num = parseFloat(String(val));
  return Number.isFinite(num) && num >= 0 ? num : null;
};

/**
 * Format age with proper unit handling (prevents "5 years years")
 * @param {*} val - Age value (could be number, string with/without units)
 * @param {string} fallback - Fallback text if invalid (default: '- years')
 * @returns {string} - Formatted age like "5 years" or "- years"
 */
export const formatAge = (val, fallback = '- years') => {
  if (!val || val === 'Unknown' || val === '-') return fallback;
  
  // If already a formatted string with "year" or "month", return as-is
  const str = String(val).trim();
  if (/^\d+\s*(year|month|day)s?$/i.test(str)) {
    return str;
  }
  
  // Remove any existing units first
  const cleaned = str.replace(/\s*(years?|months?|days?|old)\s*/gi, '').trim();
  const num = safeParseInt(cleaned);
  
  if (num === null) return fallback;
  if (num === 0) return 'Less than 1 year';
  if (num === 1) return '1 year';
  return `${num} years`;
};

/**
 * Format weight with proper unit handling (prevents "10 kg kg" or "Unknown kg")
 * @param {*} val - Weight value (could be number, string with/without units)
 * @param {string} fallback - Fallback text if invalid (default: '- kg')
 * @returns {string} - Formatted weight like "10 kg" or "- kg"
 */
export const formatWeight = (val, fallback = '- kg') => {
  if (!val || val === 'Unknown' || val === 0 || val === '-' || val === '- kg') return fallback;
  
  const str = String(val).trim();
  
  // If already has "kg", "lbs", etc., clean and return
  if (/\d+\s*(kg|lbs?|pounds?)/i.test(str)) {
    // Extract just the number and unit
    const match = str.match(/(\d+(?:\.\d+)?)\s*(kg|lbs?|pounds?)/i);
    if (match) {
      const [, num, unit] = match;
      return `${num} ${unit.toLowerCase()}`;
    }
  }
  
  // Try to parse as number
  const num = safeParseFloat(str.replace(/[^\d.]/g, ''));
  
  if (num === null || num === 0) return fallback;
  return `${num} kg`;
};

/**
 * Calculate age from birth date
 * @param {string|Date} birthDate - Birth date
 * @returns {string} - Formatted age string
 */
export const calculateAgeFromDate = (birthDate) => {
  if (!birthDate) return '-';
  
  try {
    const dob = new Date(birthDate);
    const now = new Date();
    
    if (isNaN(dob.getTime())) return '-';
    
    // Calculate years
    const years = Math.floor((now - dob) / (1000 * 60 * 60 * 24 * 365.25));
    
    if (years < 0) return '-';
    if (years === 0) {
      // Calculate months for pets less than 1 year old
      const months = Math.floor((now - dob) / (1000 * 60 * 60 * 24 * 30.44));
      if (months === 0) {
        const days = Math.floor((now - dob) / (1000 * 60 * 60 * 24));
        return days === 1 ? '1 day' : `${days} days`;
      }
      return months === 1 ? '1 month' : `${months} months`;
    }
    
    return years === 1 ? '1 year' : `${years} years`;
  } catch (e) {
    return '-';
  }
};

/**
 * Format percentage value (prevents "NaN%")
 * @param {*} val - Value to format as percentage
 * @param {number} decimals - Number of decimal places (default: 0)
 * @returns {string} - Formatted percentage like "75%" or "0%"
 */
export const formatPercentage = (val, decimals = 0) => {
  const num = safeParseFloat(val);
  if (num === null) return '0%';
  return `${num.toFixed(decimals)}%`;
};

/**
 * Safe division that returns 0 instead of NaN or Infinity
 * @param {number} numerator 
 * @param {number} denominator 
 * @returns {number} - Result or 0 if invalid
 */
export const safeDivide = (numerator, denominator) => {
  if (!denominator || denominator === 0) return 0;
  const result = numerator / denominator;
  return Number.isFinite(result) ? result : 0;
};

/**
 * Extract numeric value from age string
 * @param {*} ageStr - Age string like "5 years" or just "5"
 * @returns {number|null} - Numeric age or null
 */
export const extractAgeNumber = (ageStr) => {
  if (!ageStr) return null;
  const str = String(ageStr);
  
  // Try to extract number from strings like "5 years", "3 months", etc.
  const match = str.match(/(\d+)/);
  if (match) {
    const num = parseInt(match[1], 10);
    
    // If it's months, convert to fractional years
    if (/month/i.test(str)) {
      return Math.floor(num / 12);
    }
    
    return num;
  }
  
  return null;
};

/**
 * Extract numeric value from weight string
 * @param {*} weightStr - Weight string like "10 kg" or just "10"
 * @returns {number|null} - Numeric weight or null
 */
export const extractWeightNumber = (weightStr) => {
  if (!weightStr) return null;
  const str = String(weightStr);
  
  // Extract first number found
  const match = str.match(/(\d+(?:\.\d+)?)/);
  if (match) {
    const num = parseFloat(match[1]);
    return Number.isFinite(num) ? num : null;
  }
  
  return null;
};
