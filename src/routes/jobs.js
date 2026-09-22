const express = require('express');
const router = express.Router();

// POST /jobs - creating a job posting
router.post('/', (req, res) => {
  res.status(501).json({ message: 'not implemented yet' });
});

// GET /jobs/:id/recommendations - bonus reverse view (best-fit candidates)
router.get('/:id/recommendations', (req, res) => {
  res.status(501).json({ message: 'not implemented yet' });
});

module.exports = router;