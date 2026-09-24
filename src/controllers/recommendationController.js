const {
  getCandidateById,
  getAllCandidates,
} = require("../models/candidateModel");

const {
  getAllJobsWithSkills,
  getJobById,
} = require("../models/jobModel");

const { scoreJob } = require("../services/scoringService");

const MAX_RECOMMENDATIONS_LIMIT = 100;
const DEFAULT_RECOMMENDATIONS_LIMIT = 10;

function parseRecommendationLimit(value) {
  const requestedLimit = Number.parseInt(value, 10);

  if (Number.isNaN(requestedLimit)) {
    return DEFAULT_RECOMMENDATIONS_LIMIT;
  }

  return Math.min(
    Math.max(requestedLimit, 1),
    MAX_RECOMMENDATIONS_LIMIT
  );
}

function parseWeightsFromQuery(query) {
  if (!query.weights) return {};
  try {
    return JSON.parse(query.weights);
  } catch {
    return {};
  }
}

function toCandidateForScoring(candidate) {
  return {
    skills: candidate.skills,
    yearsExperience: Number(candidate.yearsExperience),
    location: candidate.location,
    expectedSalary: Number(candidate.expectedSalary),
  };
}

function toJobForScoring(job) {
  return {
    requiredSkills: job.requiredSkills,
    minYearsExperience: Number(job.minYearsExperience),
    location: job.location,
    remoteAllowed: job.remoteAllowed,
    salaryMin: Number(job.salaryMin),
    salaryMax: Number(job.salaryMax),
  };
}

// GET /candidates/:id/recommendations
// Jobs ranked for a candidate
async function getRecommendationsHandler(req, res) {
  try {
    const candidateId = req.params.id;
    const limit = parseRecommendationLimit(req.query.limit);
    const customWeights = parseWeightsFromQuery(req.query);

    const candidate = await getCandidateById(candidateId);

    if (!candidate) {
      return res.status(404).json({
        code: "CANDIDATE_NOT_FOUND",
        message: "Candidate not found",
        details: [],
      });
    }

    const candidateForScoring = toCandidateForScoring(candidate);

    const jobs = await getAllJobsWithSkills();

    const scored = jobs
      .map((job) => ({
        job,
        result: scoreJob(
          candidateForScoring,
          toJobForScoring(job),
          customWeights
        ),
      }))
      .filter(({ result }) => !result.disqualified)
      .sort((a, b) => b.result.overallScore - a.result.overallScore)
      .slice(0, limit)
      .map(({ job, result }) => ({
        jobId: job.id,
        title: job.title,
        overallScore: result.overallScore,
        breakdown: result.breakdown,
      }));

    return res.json(scored);
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      code: "RECOMMENDATION_GENERATION_FAILED",
      message: "Something went wrong generating recommendations",
      details: [],
    });
  }
}

// GET /jobs/:id/recommendations
// Candidates ranked for a job
async function getJobRecommendationsHandler(req, res) {
  try {
    const jobId = req.params.id;
    const limit = parseRecommendationLimit(req.query.limit);
    const customWeights = parseWeightsFromQuery(req.query);

    const job = await getJobById(jobId);

    if (!job) {
      return res.status(404).json({
        code: "JOB_NOT_FOUND",
        message: "Job not found",
        details: [],
      });
    }

    const jobForScoring = toJobForScoring(job);

    const candidates = await getAllCandidates();

    const scored = candidates
      .map((candidate) => ({
        candidate,
        result: scoreJob(
          toCandidateForScoring(candidate),
          jobForScoring,
          customWeights
        ),
      }))
      .filter(({ result }) => !result.disqualified)
      .sort((a, b) => b.result.overallScore - a.result.overallScore)
      .slice(0, limit)
      .map(({ candidate, result }) => ({
        candidateId: candidate.id,
        name: candidate.name,
        overallScore: result.overallScore,
        breakdown: result.breakdown,
      }));

    return res.json(scored);
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      code: "RECOMMENDATION_GENERATION_FAILED",
      message: "Something went wrong generating candidate recommendations",
      details: [],
    });
  }
}

module.exports = {
  getRecommendationsHandler,
  getJobRecommendationsHandler,
};