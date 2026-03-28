export const REGEX = {
  // Only Numbers
  NUMBER: /^\d+$/,

  // Text Only (letters and spaces)
  TEXT: /^[A-Za-z\s]+$/,

  // Email
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,

  // Phone Number (10 digits)
  PHONE: /^\d{10}$/,

  // ZIP / Postal Code (5 or 6 digits)
  ZIP_CODE: /^\d{5,6}$/,

  // Alphanumeric
  ALPHANUMERIC: /^[A-Za-z0-9]+$/,

  // Name (letters + spaces + dot)
  NAME: /^[A-Za-z\s.]+$/,
};