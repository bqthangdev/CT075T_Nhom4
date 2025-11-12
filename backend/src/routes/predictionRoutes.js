const express = require('express');
const router = express.Router();
const {
  predictStrokeRisk,
  getPredictionHistory
} = require('../controllers/predictionController');

// POST /api/v1/predictions/predict
router.post('/predict', predictStrokeRisk);

// GET /api/v1/predictions/history
router.get('/history', getPredictionHistory);

module.exports = router;
