// Currency configuration for AutoHub Garage
export const CURRENCY_CONFIG = {
  code: 'UGX',
  symbol: 'UGX',
  name: 'Ugandan Shilling',
  locale: 'en-UG',
  decimalDigits: 0, // UGX doesn't use decimal places
};

// Format price in UGX
// NOTE: All prices in the app are already stored as UGX amounts.
// We no longer apply any exchange-rate multiplication here.
export const formatPrice = (price: number): string => {
  const ugxPrice = Math.round(price || 0);

  return new Intl.NumberFormat(CURRENCY_CONFIG.locale, {
    style: 'currency',
    currency: CURRENCY_CONFIG.code,
    minimumFractionDigits: CURRENCY_CONFIG.decimalDigits,
    maximumFractionDigits: CURRENCY_CONFIG.decimalDigits,
  }).format(ugxPrice);
};

// Convert price to number for calculations
export const convertToNumber = (formattedPrice: string): number => {
  return parseInt(formattedPrice.replace(/[^\d]/g, ''), 10);
};

// Get currency symbol only
export const getCurrencySymbol = (): string => {
  return CURRENCY_CONFIG.symbol;
};
