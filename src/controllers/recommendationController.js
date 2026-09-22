const { getCandidateById, getAllCandidates } = require('../models/candidateModel');
const { getAllJobsWithSkills, getJobById } = require('../models/jobModel');
const { scoreJob } = require('../services/scoringService');

function toCandidateForScoring(candidate) {
  return {
    skills: candidate.skills,
    yearsExperience: Number(candidate.years_experience),
    location: candidate.location,
    expectedSalary: Number(candidate.expected_salary),
  };
}

function toJobForScoring(job) {
  return {
    requiredSkills: job.requiredSkills,
    minYearsExperience: Number(job.min_years_experience),
    location: job.location,
    remoteAllowed: job.remote_allowed,
    salaryMin: Number(job.salary_min),
    salaryMax: Number(job.salary_max),
  };
}

// GET /candidates/:id/recommendations - jobs ranked for a candidate
async function getRecommendationsHandler(req, res) {
  try {
    const candidateId = req.params.id;
    const limit = parseInt(req.query.limit) || 10;

    const candidate = await getCandidateById(candidateId);
    if (!candidate) {
      return res.status(404).json({ error: 'Candidate not found' });
    }

    const candidateForScoring = toCandidateForScoring(candidate);
    const jobs = await getAllJobsWithSkills();

    const scored = jobs
      .map(job => ({ job, result: scoreJob(candidateForScoring, toJobForScoring(job)) }))
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
    res.status(500).json({ error: 'Something went wrong generating recommendations' });
  }
}

// GET /jobs/:id/recommendations - candidates ranked for a job (bonus reverse view)
async function getJobRecommendationsHandler(req, res) {
  try {
    const jobId = req.params.id;
    const limit = parseInt(req.query.limit) || 10;

    const job = await getJobById(jobId);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    const jobForScoring = toJobForScoring(job);
    const candidates = await getAllCandidates();

    const scored = candidates
      .map(candidate => ({ candidate, result: scoreJob(toCandidateForScoring(candidate), jobForScoring) }))
      .filter(({ result }) => !result.disqualified)
      .sort((a, b) => b.result.overallScore - a.result.overallScore)
      .slice(0, limit)
      .map(({ candidate, result }) => ({
        candidateId: candidate.id,
        name: candidate.name,
        overallScore: result.overallScore,
        breakdown: result.breakdown,
      }));

    res.json(scored);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong generating candidate recommendations' });
  }
}

module.exports = { getRecommendationsHandler, getJobRecommendationsHandler };