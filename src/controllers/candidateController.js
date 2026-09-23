const { createCandidate } = require('../models/candidateModel');

async function createCandidateHandler(req, res) {
  try {
    const { name, skills, yearsExperience, location, expectedSalary } = req.body;

    if (!name || !Array.isArray(skills) || skills.length === 0 || yearsExperience === undefined || !location || expectedSalary === undefined) {
      return res.status(400).json({ error: 'Missing required fields, or skills must be a non-empty array' });
    }

    const candidate = await createCandidate({ name, skills, yearsExperience, location, expectedSalary });
    res.status(201).json(candidate);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong creating the candidate' });
  }
}

module.exports = { createCandidateHandler };