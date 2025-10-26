/**
 * Utility functions for formatting values (currency, numbers, etc.)
 */

/**
 * Format a number as Indian Rupees
 * @param {number} value - Value to format
 * @param {boolean} includeSymbol - Whether to include the ₹ symbol (default: true)
 * @returns {string} - Formatted rupee value like "₹45,000" or "45,000"
 */
export const inr = (value, includeSymbol = true) => {
  if (value === null || value === undefined) return includeSymbol ? '₹0' : '0';
  
  const num = parseFloat(value);
  if (!Number.isFinite(num)) return includeSymbol ? '₹0' : '0';
  
  // Format with comma separators
  const formatted = num.toLocaleString('en-IN', {
    style: 'decimal',
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  });
  
  return includeSymbol ? `₹${formatted}` : formatted;
};

/**
 * Format a number as USD
 * @param {number} value - Value to format
 * @param {boolean} includeSymbol - Whether to include the $ symbol (default: true)
 * @returns {string} - Formatted dollar value like "$45,000" or "45,000"
 */
export const usd = (value, includeSymbol = true) => {
  if (value === null || value === undefined) return includeSymbol ? '$0' : '0';
  
  const num = parseFloat(value);
  if (!Number.isFinite(num)) return includeSymbol ? '$0' : '0';
  
  const formatted = num.toLocaleString('en-US', {
    style: 'decimal',
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  });
  
  return includeSymbol ? `$${formatted}` : formatted;
};

/**
 * Format a number with thousand separators
 * @param {number} value - Value to format
 * @param {number} decimals - Number of decimal places (default: 0)
 * @returns {string} - Formatted number like "45,000" or "45,000.50"
 */
export const formatNumber = (value, decimals = 0) => {
  if (value === null || value === undefined) return '0';
  
  const num = parseFloat(value);
  if (!Number.isFinite(num)) return '0';
  
  return num.toLocaleString('en-IN', {
    style: 'decimal',
    maximumFractionDigits: decimals,
    minimumFractionDigits: decimals,
  });
};

/**
 * Format a number as a percentage
 * @param {number} value - Value to format (0-100)
 * @param {number} decimals - Number of decimal places (default: 1)
 * @returns {string} - Formatted percentage like "45.5%"
 */
export const formatPercentage = (value, decimals = 1) => {
  if (value === null || value === undefined) return '0%';
  
  const num = parseFloat(value);
  if (!Number.isFinite(num)) return '0%';
  
  return `${num.toFixed(decimals)}%`;
};