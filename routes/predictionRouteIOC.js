// routes/prediction-ioc.js
const express = require('express');
const router = express.Router();
const { createPrediction } = require('../controllers/predictionControllerIOC'); 

// POST /api/prediction-ioc
router.post('/', createPrediction);

module.exports = router;

