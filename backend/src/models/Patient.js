const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema({
  // Demographics
  age: {
    type: Number,
    required: true,
    min: 0
  },
  gender: {
    type: String,
    required: true,
    enum: ['Male', 'Female', 'Other']
  },
  
  // Medical History
  hypertension: {
    type: Boolean,
    default: false
  },
  heartDisease: {
    type: Boolean,
    default: false
  },
  
  // Lifestyle
  everMarried: {
    type: String,
    enum: ['Yes', 'No']
  },
  workType: {
    type: String,
    enum: ['Private', 'Self-employed', 'Govt_job', 'children', 'Never_worked']
  },
  residenceType: {
    type: String,
    enum: ['Urban', 'Rural']
  },
  smokingStatus: {
    type: String,
    enum: ['formerly smoked', 'never smoked', 'smokes', 'Unknown']
  },
  
  // Health Metrics
  avgGlucoseLevel: {
    type: Number,
    required: true,
    min: 0
  },
  bmi: {
    type: Number,
    required: true,
    min: 0
  },
  
  // Prediction Results
  strokeRisk: {
    type: Number,
    min: 0,
    max: 1
  },
  prediction: {
    type: String,
    enum: ['Low Risk', 'Medium Risk', 'High Risk']
  },
  
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Patient', patientSchema);
