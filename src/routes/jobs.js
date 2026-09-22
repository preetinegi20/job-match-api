const express = require('express');
const router = express.Router();
const { createJobHandler } = require('../controllers/jobController');

router.post('/', createJobHandler);

// GET /jobs/:id/recommendations - bonus reverse view (best-fit candidates)
router.get('/:id/recommendations', (req, res) => {
  res.status(501).json({ message: 'not implemented yet' });
});

module.exports = router;