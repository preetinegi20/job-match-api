const express = require('express');
const router = express.Router();
const { createJobHandler } = require('../controllers/jobController');
const { getJobRecommendationsHandler } = require('../controllers/recommendationController');

router.post('/', createJobHandler);
router.get('/:id/recommendations', getJobRecommendationsHandler);

module.exports = router;