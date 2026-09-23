const DEFAULT_WEIGHTS = {
  skills: { max: 50, baseForMustHaves: 35 },
  experience: { max: 20, penaltyPerYearShort: 4 },
  location: { max: 15, remotePoints: 9 },
  salary: { max: 15 },
};

function normalizeSkill(skill) {
  return skill.trim().toLowerCase();
}

function scoreSkills(candidateSkills, jobSkills, weights = DEFAULT_WEIGHTS.skills) {
  const candidateSet = new Set(candidateSkills.map(normalizeSkill));

  const mustHaves = jobSkills.filter(s => s.mustHave);
  const niceToHaves = jobSkills.filter(s => !s.mustHave);

  const missingMustHave = mustHaves.some(s => !candidateSet.has(normalizeSkill(s.name)));
  if (missingMustHave) {
    return { score: 0, max: weights.max, disqualified: true, detail: 'Missing one or more must-have skills' };
  }

  let score = weights.baseForMustHaves;

  if (niceToHaves.length > 0) {
    const remainingPoints = weights.max - weights.baseForMustHaves;
    const pointsPerNiceToHave = remainingPoints / niceToHaves.length;
    const matchedNiceToHaves = niceToHaves.filter(s => candidateSet.has(normalizeSkill(s.name)));
    score += matchedNiceToHaves.length * pointsPerNiceToHave;
  } else {
    score = weights.max;
  }

  return { score: Math.round(score), max: weights.max, disqualified: false };
}

function scoreExperience(candidateYears, minYearsRequired, weights = DEFAULT_WEIGHTS.experience) {
  if (candidateYears >= minYearsRequired) {
    return { score: weights.max, max: weights.max };
  }

  const yearsShort = minYearsRequired - candidateYears;
  const score = Math.max(0, weights.max - yearsShort * weights.penaltyPerYearShort);

  return { score: Math.round(score), max: weights.max };
}

function scoreLocation( candidateLocation, jobLocation, remoteAllowed, weights = DEFAULT_WEIGHTS.location) {
  const normalize = (loc) => loc.trim().toLowerCase();

  if (normalize(candidateLocation) === normalize(jobLocation)) {
    return {
      score: weights.max,
      max: weights.max,
    };
  }

  if (remoteAllowed) {
    const remotePoints = weights.remotePoints;

    return {
      score: Math.round(remotePoints),
      max: weights.max,
    };
  }

  return {
    score: 0,
    max: weights.max,
  };
}


function scoreSalary(expectedSalary, salaryMin, salaryMax, weights = DEFAULT_WEIGHTS.salary) {
  if (salaryMax < expectedSalary) {
    return { score: 0, max: weights.max };
  }

  if (salaryMin >= expectedSalary) {
    return { score: weights.max, max: weights.max };
  }

  if (salaryMax === salaryMin) {
    return { score: weights.max, max: weights.max };
  }

  const score = weights.max * (salaryMax - expectedSalary) / (salaryMax - salaryMin);

  return { score: Math.round(score), max: weights.max };
}

function scoreJob(candidate, job, customWeights = {}) {
  const weights = {
    skills: { ...DEFAULT_WEIGHTS.skills, ...customWeights.skills },
    experience: { ...DEFAULT_WEIGHTS.experience, ...customWeights.experience },
    location: { ...DEFAULT_WEIGHTS.location, ...customWeights.location },
    salary: { ...DEFAULT_WEIGHTS.salary, ...customWeights.salary },
  };

  const skills = scoreSkills(candidate.skills, job.requiredSkills, weights.skills);

  if (skills.disqualified) {
    return {
      disqualified: true,
      overallScore: 0,
      breakdown: {
        skills: { score: 0, max: weights.skills.max },
        experience: { score: 0, max: weights.experience.max },
        location: { score: 0, max: weights.location.max },
        salary: { score: 0, max: weights.salary.max },
      },
    };
  }

  const experience = scoreExperience(candidate.yearsExperience, job.minYearsExperience, weights.experience);
  const location = scoreLocation(candidate.location, job.location, job.remoteAllowed, weights.location);
  const salary = scoreSalary(candidate.expectedSalary, job.salaryMin, job.salaryMax, weights.salary);

  const overallScore = skills.score + experience.score + location.score + salary.score;

  return {
    disqualified: false,
    overallScore,
    breakdown: {
      skills: { score: skills.score, max: weights.skills.max },
      experience: { score: experience.score, max: weights.experience.max },
      location: { score: location.score, max: weights.location.max },
      salary: { score: salary.score, max: weights.salary.max },
    },
  };
}

module.exports = { scoreSkills, scoreExperience, scoreLocation, scoreSalary, scoreJob, normalizeSkill, DEFAULT_WEIGHTS };