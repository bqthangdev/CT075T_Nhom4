// Utility functions for frontend

export const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const formatPercentage = (value) => {
  return `${(value * 100).toFixed(2)}%`;
};

// Sanitize a Vietnamese full name: collapse spaces, trim
export const sanitizeFullName = (value) => {
  if (typeof value !== 'string') return value;
  return value.replace(/\s+/g, ' ').trim();
};

// Validate that a name contains only letters (all locales) and spaces
export const isValidFullName = (value) => {
  if (typeof value !== 'string') return false;
  const v = sanitizeFullName(value);
  if (v.length < 2 || v.length > 50) return false;
  // Allow letters (incl. Vietnamese), digits and spaces only (no special chars)
  return /^[A-Za-zÀ-ỹà-ỹĐđ0-9 ]+$/.test(v);
};

// Digits-only helper
export const onlyDigits = (value) => (typeof value === 'string' ? value.replace(/\D/g, '') : value);

// Check if all digits are the same (e.g., 000000..., 111111...)
export const isAllSameDigits = (value) => {
  const v = String(value || '');
  return /^([0-9])\1+$/.test(v);
};

export const getRiskColor = (riskLevel) => {
  switch (riskLevel) {
    case 'Low Risk':
      return 'green';
    case 'Medium Risk':
      return 'orange';
    case 'High Risk':
      return 'red';
    default:
      return 'gray';
  }
};

export const calculateBMI = (weight, heightCm) => {
  const heightM = heightCm / 100;
  return (weight / (heightM * heightM)).toFixed(2);
};

export const getBMICategory = (bmi) => {
  if (bmi < 18.5) return 'Thiếu cân';
  if (bmi < 25) return 'Bình thường';
  if (bmi < 30) return 'Thừa cân';
  return 'Béo phì';
};

export const validateForm = (values) => {
  const errors = {};
  
  if (!values.age || values.age < 0) {
    errors.age = 'Tuổi không hợp lệ';
  }
  
  if (!values.avgGlucoseLevel || values.avgGlucoseLevel < 0) {
    errors.avgGlucoseLevel = 'Chỉ số glucose không hợp lệ';
  }
  
  if (!values.bmi || values.bmi < 0) {
    errors.bmi = 'BMI không hợp lệ';
  }
  
  return errors;
};

// Cross-browser safe blob download with filename sanitization
export const downloadBlob = (data, filename, mime = 'application/octet-stream') => {
  try {
    const safeName = String(filename).replace(/[\\/:*?"<>|]/g, '_');
    const blob = data instanceof Blob ? data : new Blob([data], { type: mime });

    // IE/Edge legacy
    // eslint-disable-next-line no-undef
    if (window.navigator && window.navigator.msSaveOrOpenBlob) {
      // eslint-disable-next-line no-undef
      window.navigator.msSaveOrOpenBlob(blob, safeName);
      return true;
    }

    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = safeName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    return true;
  } catch (e) {
    console.error('downloadBlob error:', e);
    return false;
  }
};

// === Glucose unit conversions ===
// Supported units: mg/dL (default), mmol/L, mg/L, g/L
export const GLUCOSE_UNITS = {
  MG_DL: 'mg/dL',
  MMOL_L: 'mmol/L',
  MG_L: 'mg/L',
  G_L: 'g/L',
};

// Conversion factors to mg/dL for glucose
// mmol/L uses factor 18 for glucose (approx. 18.0)
const FACTOR_TO_MGDL = {
  'mg/dL': 1,
  'mmol/L': 18,
  'mg/L': 0.1,
  'g/L': 100,
};

export const convertGlucose = (value, fromUnit, toUnit, precision = 1) => {
  if (value === undefined || value === null || value === '') return value;
  if (Number.isNaN(Number(value))) return value;
  const from = FACTOR_TO_MGDL[fromUnit] ?? 1;
  const to = FACTOR_TO_MGDL[toUnit] ?? 1;
  const mgdl = Number(value) * from;
  const result = mgdl / to;
  const factor = Math.pow(10, precision);
  return Math.round(result * factor) / factor;
};

export const normalizeGlucoseMgDl = (value, unit) => {
  return convertGlucose(value, unit, GLUCOSE_UNITS.MG_DL, 1);
};
