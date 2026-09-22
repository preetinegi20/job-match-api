const express = require('express');
const router = express.Router();

// POST /candidates - creating a candidate profile
router.post('/', (req, res) => {
  res.status(501).json({ message: 'not implemented yet' });
});

module.exports = router;