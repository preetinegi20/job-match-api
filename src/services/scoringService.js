function normalizeSkill(skill) {
  return skill.trim().toLowerCase();
}

function scoreSkills(candidateSkills, jobSkills) {
  const candidateSet = new Set(candidateSkills.map(normalizeSkill));

  const mustHaves = jobSkills.filter((s) => s.mustHave);
  const niceToHaves = jobSkills.filter((s) => !s.mustHave);

  const missingMustHave = mustHaves.some(
    (s) => !candidateSet.has(normalizeSkill(s.name))
  );
  if (missingMustHave) {
    return {
      score: 0,
      max: 50,
      disqualified: true,
      detail: "Missing one or more must-have skills",
    };
  }

  // Cleared the gate: base points for having all must-haves
  let score = 35;

  // Remaining 15 points split across nice-to-haves
  if (niceToHaves.length > 0) {
    const pointsPerNiceToHave = 15 / niceToHaves.length;
    const matchedNiceToHaves = niceToHaves.filter((s) =>
      candidateSet.has(normalizeSkill(s.name))
    );
    score += matchedNiceToHaves.length * pointsPerNiceToHave;
  } else {
    // No nice-to-haves defined on this job — don't penalize, just cap at base
    score = 50;
  }

  return { score: Math.round(score), max: 50, disqualified: false };
}

function scoreExperience(candidateYears, minYearsRequired) {
  const MAX_POINTS = 20;
  const PENALTY_PER_YEAR_SHORT = 4;

  if (candidateYears >= minYearsRequired) {
    return { score: MAX_POINTS, max: MAX_POINTS };
  }

  const yearsShort = minYearsRequired - candidateYears;
  const score = Math.max(0, MAX_POINTS - yearsShort * PENALTY_PER_YEAR_SHORT);

  return { score: Math.round(score), max: MAX_POINTS };
}

function scoreLocation(candidateLocation, jobLocation, remoteAllowed) {
  const MAX_POINTS = 15;
  const REMOTE_POINTS = 9;

  const normalize = (loc) => loc.trim().toLowerCase();

  if (normalize(candidateLocation) === normalize(jobLocation)) {
    return { score: MAX_POINTS, max: MAX_POINTS };
  }

  if (remoteAllowed) {
    return { score: REMOTE_POINTS, max: MAX_POINTS };
  }

  return { score: 0, max: MAX_POINTS };
}
function scoreSalary(expectedSalary, salaryMin, salaryMax) {
  const MAX_POINTS = 15;

  // Job's max can't even meet expectation -> near zero
  if (salaryMax < expectedSalary) {
    return { score: 0, max: MAX_POINTS };
  }

  // Job's min already comfortably meets/exceeds expectation -> full score
  if (salaryMin >= expectedSalary) {
    return { score: MAX_POINTS, max: MAX_POINTS };
  }

  // Expected salary falls inside the range somewhere -> interpolate
  // Closer to jobMax (i.e. expectation is on the lower end of the range) = higher score
  const score =
    (MAX_POINTS * (salaryMax - expectedSalary)) / (salaryMax - salaryMin);

  return { score: Math.round(score), max: MAX_POINTS };
}
function scoreJob(candidate, job) {
  const skills = scoreSkills(candidate.skills, job.requiredSkills);

  if (skills.disqualified) {
    return {
      disqualified: true,
      overallScore: 0,
      breakdown: {
        skills: { score: 0, max: 50 },
        experience: { score: 0, max: 20 },
        location: { score: 0, max: 15 },
        salary: { score: 0, max: 15 },
      },
    };
  }

  const experience = scoreExperience(
    candidate.yearsExperience,
    job.minYearsExperience
  );
  const location = scoreLocation(
    candidate.location,
    job.location,
    job.remoteAllowed
  );
  const salary = scoreSalary(
    candidate.expectedSalary,
    job.salaryMin,
    job.salaryMax
  );

  const overallScore =
    skills.score + experience.score + location.score + salary.score;

  return {
    disqualified: false,
    overallScore,
    breakdown: {
      skills: { score: skills.score, max: skills.max },
      experience: { score: experience.score, max: experience.max },
      location: { score: location.score, max: location.max },
      salary: { score: salary.score, max: salary.max },
    },
  };
}
async function getCandidateById(id) {
  const result = await pool.query("SELECT * FROM candidates WHERE id = $1", [
    id,
  ]);
  return result.rows[0];
}
module.exports = {
  scoreSkills,
  scoreExperience,
  normalizeSkill,
  scoreLocation,
  scoreSalary,
  scoreJob,
  getCandidateById,
};
