// Centralized risk label/color utilities

export const RISK_THRESHOLDS = {
  low: 0.33,
  high: 0.66,
};

export function riskFromScore(score) {
  if (score < RISK_THRESHOLDS.low) return 'Low Risk';
  if (score < RISK_THRESHOLDS.high) return 'Medium Risk';
  return 'High Risk';
}

export function getRiskLabelVi(level) {
  const map = {
    'Low Risk': 'Thấp',
    'Medium Risk': 'Trung bình',
    'High Risk': 'Cao',
  };
  return map[level] || level;
}

export function getRiskColor(level) {
  const map = {
    'Low Risk': 'green',
    'Medium Risk': 'orange',
    'High Risk': 'red',
  };
  return map[level] || 'default';
}

export function getRiskColorByScore(score) {
  return score < RISK_THRESHOLDS.low
    ? '#52c41a'
    : score < RISK_THRESHOLDS.high
    ? '#fa8c16'
    : '#f5222d';
}
