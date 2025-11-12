// Validation middleware for request data

const validatePredictionInput = (req, res, next) => {
  const { age, gender, avgGlucoseLevel, bmi } = req.body;
  
  const errors = [];
  
  if (!age || age < 0) {
    errors.push('Valid age is required');
  }
  
  if (!gender || !['Male', 'Female', 'Other'].includes(gender)) {
    errors.push('Valid gender is required');
  }
  
  if (!avgGlucoseLevel || avgGlucoseLevel < 0) {
    errors.push('Valid average glucose level is required');
  }
  
  if (!bmi || bmi < 0) {
    errors.push('Valid BMI is required');
  }
  
  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      errors
    });
  }
  
  next();
};

module.exports = {
  validatePredictionInput
};
