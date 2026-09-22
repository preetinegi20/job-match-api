const pool = require('../db/pool');

async function createJob({ title, minYearsExperience, location, salaryMin, salaryMax, remoteAllowed, requiredSkills }) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const jobResult = await client.query(
      `INSERT INTO jobs (title, min_years_experience, location, salary_min, salary_max, remote_allowed)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [title, minYearsExperience, location, salaryMin, salaryMax, remoteAllowed]
    );
    const job = jobResult.rows[0];

    for (const skill of requiredSkills) {
      await client.query(
        `INSERT INTO job_skills (job_id, skill, is_must_have) VALUES ($1, $2, $3)`,
        [job.id, skill.name, skill.mustHave]
      );
    }

    await client.query('COMMIT');
    return { ...job, requiredSkills };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

module.exports = { createJob };