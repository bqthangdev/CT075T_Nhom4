// Helper functions for data validation and formatting

const validatePatientData = (data) => {
  const errors = {};
  
  if (!data.age || data.age < 0 || data.age > 120) {
    errors.age = 'Age must be between 0 and 120';
  }
  
  if (!data.gender || !['Male', 'Female', 'Other'].includes(data.gender)) {
    errors.gender = 'Invalid gender';
  }
  
  if (data.avgGlucoseLevel < 0) {
    errors.avgGlucoseLevel = 'Average glucose level must be positive';
  }
  
  if (data.bmi < 0 || data.bmi > 100) {
    errors.bmi = 'BMI must be between 0 and 100';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

const formatPatientData = (data) => {
  return {
    age: Number(data.age),
    gender: data.gender,
    hypertension: Boolean(data.hypertension),
    heartDisease: Boolean(data.heartDisease),
    everMarried: data.everMarried,
    workType: data.workType,
    residenceType: data.residenceType,
    avgGlucoseLevel: Number(data.avgGlucoseLevel),
    bmi: Number(data.bmi),
    smokingStatus: data.smokingStatus
  };
};

module.exports = {
  validatePatientData,
  formatPatientData
};
