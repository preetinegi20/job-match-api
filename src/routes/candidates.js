const express = require('express');
const router = express.Router();
const { createCandidateHandler } = require('../controllers/candidateController');
const { getRecommendationsHandler } = require('../controllers/recommendationController');

router.post('/', createCandidateHandler);
router.get('/:id/recommendations', getRecommendationsHandler);

module.exports = router;