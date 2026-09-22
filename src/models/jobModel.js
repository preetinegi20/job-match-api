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
async function getAllJobsWithSkills() {
  const jobsResult = await pool.query('SELECT * FROM jobs');
  const jobs = jobsResult.rows;

  const skillsResult = await pool.query('SELECT * FROM job_skills');
  const allSkills = skillsResult.rows;

  return jobs.map(job => ({
    ...job,
    requiredSkills: allSkills
      .filter(s => s.job_id === job.id)
      .map(s => ({ name: s.skill, mustHave: s.is_must_have })),
  }));
}

async function getJobById(id) {
  const jobResult = await pool.query('SELECT * FROM jobs WHERE id = $1', [id]);
  const job = jobResult.rows[0];
  if (!job) return null;

  const skillsResult = await pool.query('SELECT * FROM job_skills WHERE job_id = $1', [id]);
  return {
    ...job,
    requiredSkills: skillsResult.rows.map(s => ({ name: s.skill, mustHave: s.is_must_have })),
  };
}
module.exports = { createJob, getAllJobsWithSkills, getJobById };