const express = require('express');
const router = express.Router();
const { createCandidateHandler } = require('../controllers/candidateController');

router.post('/', createCandidateHandler);

module.exports = router;