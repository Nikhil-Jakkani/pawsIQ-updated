/**
 * Session management utilities to help with authentication persistence
 */

/**
 * Check if a JWT token is expired
 * @param {string} token - JWT token
 * @returns {boolean} - True if expired
 */
export const isTokenExpired = (token) => {
  if (!token) return true;
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Math.floor(Date.now() / 1000);
    return payload.exp <= currentTime;
  } catch (error) {
    console.error('[Session] Invalid token format:', error);
    return true;
  }
};

/**
 * Get token expiration time
 * @param {string} token - JWT token
 * @returns {Date|null} - Expiration date or null if invalid
 */
export const getTokenExpiration = (token) => {
  if (!token) return null;
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return new Date(payload.exp * 1000);
  } catch (error) {
    console.error('[Session] Invalid token format:', error);
    return null;
  }
};

/**
 * Check if session should be refreshed (token expires within threshold)
 * @param {string} token - JWT token
 * @param {number} thresholdMinutes - Minutes before expiry to refresh (default: 5)
 * @returns {boolean} - True if should refresh
 */
export const shouldRefreshToken = (token, thresholdMinutes = 5) => {
  if (!token) return true;
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Math.floor(Date.now() / 1000);
    const thresholdTime = currentTime + (thresholdMinutes * 60);
    return payload.exp <= thresholdTime;
  } catch (error) {
    console.error('[Session] Invalid token format:', error);
    return true;
  }
};

/**
 * Validate localStorage auth data structure
 * @param {Object} authData - Auth data from localStorage
 * @returns {boolean} - True if valid structure
 */
export const validateStoredAuthData = (authData) => {
  if (!authData || typeof authData !== 'object') return false;
  
  const { tokens, user } = authData;
  
  if (!tokens || !tokens.access || !tokens.refresh) return false;
  if (!tokens.access.token || !tokens.refresh.token) return false;
  if (!user || !user.user_id) return false;
  
  return true;
};

/**
 * Clean invalid session data from localStorage
 */
export const cleanInvalidSessionData = () => {
  try {
    const keys = ['authTokens', 'user', 'accessToken', 'refreshToken'];
    
    keys.forEach(key => {
      try {
        const data = localStorage.getItem(key);
        if (data) {
          JSON.parse(data); // This will throw if invalid JSON
        }
      } catch (error) {
        console.warn(`[Session] Removing invalid data for key: ${key}`);
        localStorage.removeItem(key);
      }
    });
  } catch (error) {
    console.error('[Session] Error cleaning session data:', error);
  }
};

/**
 * Check if user explicitly logged out
 * @returns {boolean} - True if user explicitly logged out
 */
export const wasExplicitlyLoggedOut = () => {
  return localStorage.getItem('loggedOut') === '1';
};

/**
 * Clear explicit logout flag
 */
export const clearLogoutFlag = () => {
  localStorage.removeItem('loggedOut');
};

/**
 * Set explicit logout flag
 */
export const setLogoutFlag = () => {
  localStorage.setItem('loggedOut', '1');
};

/**
 * Get time until token expires in minutes
 * @param {string} token - JWT token
 * @returns {number} - Minutes until expiry (negative if already expired)
 */
export const getMinutesUntilExpiry = (token) => {
  if (!token) return -1;
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Math.floor(Date.now() / 1000);
    const timeUntilExpiry = payload.exp - currentTime;
    return Math.floor(timeUntilExpiry / 60);
  } catch (error) {
    console.error('[Session] Invalid token format:', error);
    return -1;
  }
};
