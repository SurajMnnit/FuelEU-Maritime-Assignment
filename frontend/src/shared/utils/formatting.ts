/**
 * Formats a number to a string with specified decimal places.
 * Handles null, undefined, and string values gracefully.
 * 
 * @param value - The number to format (can be number, string, null, or undefined)
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted string or 'N/A' if value cannot be converted
 */
export const formatNumber = (value: number | string | null | undefined, decimals: number = 2): string => {
  if (value === null || value === undefined) {
    return 'N/A';
  }
  
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(numValue)) {
    return 'N/A';
  }
  
  return numValue.toFixed(decimals);
};

export const formatPercentage = (value: number | string | null | undefined, decimals: number = 2): string => {
  if (value === null || value === undefined) {
    return 'N/A';
  }
  
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(numValue)) {
    return 'N/A';
  }
  
  return `${numValue >= 0 ? '+' : ''}${numValue.toFixed(decimals)}%`;
};

export const formatEmissions = (value: number | string | null | undefined): string => {
  const formatted = formatNumber(value, 1);
  return formatted === 'N/A' ? 'N/A' : `${formatted} tons CO₂e`;
};

export const formatIntensity = (value: number | string | null | undefined): string => {
  const formatted = formatNumber(value, 2);
  return formatted === 'N/A' ? 'N/A' : `${formatted} gCO₂e/MJ`;
};

export const formatDistance = (value: number | string | null | undefined): string => {
  const formatted = formatNumber(value, 0);
  return formatted === 'N/A' ? 'N/A' : `${formatted} nm`;
};

export const formatFuel = (value: number | string | null | undefined): string => {
  const formatted = formatNumber(value, 1);
  return formatted === 'N/A' ? 'N/A' : `${formatted} tons`;
};
