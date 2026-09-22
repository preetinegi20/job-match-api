const { getCandidateById } = require("../models/candidateModel");
const { getAllJobsWithSkills } = require("../models/jobModel");
const { scoreJob } = require("../services/scoringService");

async function getRecommendationsHandler(req, res) {
  try {
    const candidateId = req.params.id;
    const limit = parseInt(req.query.limit) || 10;

    const candidate = await getCandidateById(candidateId);
    if (!candidate) {
      return res.status(404).json({ error: "Candidate not found" });
    }

    // Adapt DB row (snake_case) to the shape scoreJob expects
    const candidateForScoring = {
      skills: candidate.skills,
      yearsExperience: Number(candidate.years_experience),
      location: candidate.location,
      expectedSalary: Number(candidate.expected_salary),
    };

    const jobs = await getAllJobsWithSkills();

    const scored = jobs
      .map((job) => {
        const jobForScoring = {
          requiredSkills: job.requiredSkills,
          minYearsExperience: Number(job.min_years_experience),
          location: job.location,
          remoteAllowed: job.remote_allowed,
          salaryMin: Number(job.salary_min),
          salaryMax: Number(job.salary_max),
        };
        const result = scoreJob(candidateForScoring, jobForScoring);
        return { job, result };
      })
      .filter(({ result }) => !result.disqualified)
      .sort((a, b) => b.result.overallScore - a.result.overallScore)
      .slice(0, limit)
      .map(({ job, result }) => ({
        jobId: job.id,
        title: job.title,
        overallScore: result.overallScore,
        breakdown: result.breakdown,
      }));

    res.json(scored);
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ error: "Something went wrong generating recommendations" });
  }
}

module.exports = { getRecommendationsHandler };
