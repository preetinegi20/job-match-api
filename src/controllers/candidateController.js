const { createCandidate } = require('../models/candidateModel');

async function createCandidateHandler(req, res) {
  try {
    const { name, skills, yearsExperience, location, expectedSalary } = req.body;

    if (!name || !Array.isArray(skills) || skills.length === 0 || yearsExperience === undefined || !location || expectedSalary === undefined) {
      return res.status(400).json({
        code: 'INVALID_CANDIDATE_INPUT',
        message: 'Missing required fields, or skills must be a non-empty array',
        details: [],
      });
    }

    const candidate = await createCandidate({ name, skills, yearsExperience, location, expectedSalary });
    res.status(201).json(candidate);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      code: 'CANDIDATE_CREATION_FAILED',
      message: 'Something went wrong creating the candidate',
      details: [],
    });
  }
}

module.exports = { createCandidateHandler };