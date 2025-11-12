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
