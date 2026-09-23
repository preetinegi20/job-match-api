const pool = require('../db/pool');

async function createCandidate({
  name,
  skills,
  yearsExperience,
  location,
  expectedSalary
}) {
  const result = await pool.query(
    `
      INSERT INTO candidates (
        name,
        skills,
        years_experience,
        location,
        expected_salary
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING
        id,
        name,
        skills,
        years_experience AS "yearsExperience",
        location,
        expected_salary AS "expectedSalary"
    `,
    [
      name,
      skills,
      yearsExperience,
      location,
      expectedSalary
    ]
  );

  return result.rows[0];
}

async function getCandidateById(id) {
  const result = await pool.query(
    `
      SELECT
        id,
        name,
        skills,
        years_experience AS "yearsExperience",
        location,
        expected_salary AS "expectedSalary"
      FROM candidates
      WHERE id = $1
    `,
    [id]
  );

  return result.rows[0] || null;
}

async function getAllCandidates() {
  const result = await pool.query(`
    SELECT
      id,
      name,
      skills,
      years_experience AS "yearsExperience",
      location,
      expected_salary AS "expectedSalary"
    FROM candidates
    ORDER BY id
  `);

  return result.rows;
}

module.exports = {
  createCandidate,
  getCandidateById,
  getAllCandidates
};