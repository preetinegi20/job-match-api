const pool = require('../db/pool');

async function createJob({
  title,
  minYearsExperience,
  location,
  salaryMin,
  salaryMax,
  remoteAllowed,
  requiredSkills
}) {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const jobResult = await client.query(
      `
        INSERT INTO jobs (
          title,
          min_years_experience,
          location,
          salary_min,
          salary_max,
          remote_allowed
        )
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING
          id,
          title,
          min_years_experience AS "minYearsExperience",
          location,
          salary_min AS "salaryMin",
          salary_max AS "salaryMax",
          remote_allowed AS "remoteAllowed"
      `,
      [
        title,
        minYearsExperience,
        location,
        salaryMin,
        salaryMax,
        remoteAllowed
      ]
    );

    const job = jobResult.rows[0];

    if (requiredSkills.length > 0) {
      const values = [];

      const placeholders = requiredSkills.map((skill, index) => {
        const base = index * 3;

        values.push(
          job.id,
          skill.name,
          skill.mustHave
        );

        return `($${base + 1}, $${base + 2}, $${base + 3})`;
      });

      await client.query(
        `
          INSERT INTO job_skills (
            job_id,
            skill,
            is_must_have
          )
          VALUES ${placeholders.join(', ')}
        `,
        values
      );
    }

    await client.query('COMMIT');

    return {
      ...job,
      requiredSkills
    };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function getAllJobsWithSkills() {
  const result = await pool.query(`
    SELECT
      j.id,
      j.title,
      j.min_years_experience AS "minYearsExperience",
      j.location,
      j.salary_min AS "salaryMin",
      j.salary_max AS "salaryMax",
      j.remote_allowed AS "remoteAllowed",
      js.skill,
      js.is_must_have
    FROM jobs j
    LEFT JOIN job_skills js
      ON js.job_id = j.id
    ORDER BY j.id
  `);

  const jobMap = new Map();

  for (const row of result.rows) {
    if (!jobMap.has(row.id)) {
      jobMap.set(row.id, {
        id: row.id,
        title: row.title,
        minYearsExperience: Number(row.minYearsExperience),
        location: row.location,
        salaryMin: Number(row.salaryMin),
        salaryMax: Number(row.salaryMax),
        remoteAllowed: row.remoteAllowed,
        requiredSkills: []
      });
    }

    if (row.skill) {
      jobMap.get(row.id).requiredSkills.push({
        name: row.skill,
        mustHave: row.is_must_have
      });
    }
  }

  return [...jobMap.values()];
}

async function getJobById(id) {
  const result = await pool.query(
    `
      SELECT
        j.id,
        j.title,
        j.min_years_experience AS "minYearsExperience",
        j.location,
        j.salary_min AS "salaryMin",
        j.salary_max AS "salaryMax",
        j.remote_allowed AS "remoteAllowed",
        js.skill,
        js.is_must_have
      FROM jobs j
      LEFT JOIN job_skills js
        ON js.job_id = j.id
      WHERE j.id = $1
    `,
    [id]
  );

  if (result.rows.length === 0) {
    return null;
  }

  const job = {
    id: result.rows[0].id,
    title: result.rows[0].title,
    minYearsExperience: Number(result.rows[0].minYearsExperience),
    location: result.rows[0].location,
    salaryMin: Number(result.rows[0].salaryMin),
    salaryMax: Number(result.rows[0].salaryMax),
    remoteAllowed: result.rows[0].remoteAllowed,
    requiredSkills: []
  };

  for (const row of result.rows) {
    if (row.skill) {
      job.requiredSkills.push({
        name: row.skill,
        mustHave: row.is_must_have
      });
    }
  }

  return job;
}

module.exports = {
  createJob,
  getAllJobsWithSkills,
  getJobById
};