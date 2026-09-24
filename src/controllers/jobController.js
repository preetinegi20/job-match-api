const { createJob } = require("../models/jobModel");

async function createJobHandler(req, res) {
  try {
    const {
      title,
      minYearsExperience,
      location,
      salaryMin,
      salaryMax,
      remoteAllowed,
      requiredSkills,
    } = req.body;

    if (
      !title ||
      minYearsExperience === undefined ||
      !location ||
      salaryMin === undefined ||
      salaryMax === undefined ||
      !Array.isArray(requiredSkills)
    ) {
      return res.status(400).json({
        code: "INVALID_JOB_INPUT",
        message: "Missing required fields",
        details: [],
      });
    }

    const job = await createJob({
      title,
      minYearsExperience,
      location,
      salaryMin,
      salaryMax,
      remoteAllowed: !!remoteAllowed,
      requiredSkills,
    });

    res.status(201).json(job);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      code: "JOB_CREATION_FAILED",
      message: "Something went wrong creating the job",
      details: [],
    });
  }
}

module.exports = { createJobHandler };