const pool = require('../db/pool');

async function createCandidate({ name, skills, yearsExperience, location, expectedSalary }) {
  const result = await pool.query(
    `INSERT INTO candidates (name, skills, years_experience, location, expected_salary)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [name, skills, yearsExperience, location, expectedSalary]
  );
  return result.rows[0];
}
async function getCandidateById(id) {
  const result = await pool.query('SELECT * FROM candidates WHERE id = $1', [id]);
  return result.rows[0];
}

module.exports = { createCandidate, getCandidateById };