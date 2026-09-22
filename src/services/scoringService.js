function normalizeSkill(skill) {
  return skill.trim().toLowerCase();
}

function scoreSkills(candidateSkills, jobSkills) {
  const candidateSet = new Set(candidateSkills.map(normalizeSkill));

  const mustHaves = jobSkills.filter(s => s.mustHave);
  const niceToHaves = jobSkills.filter(s => !s.mustHave);

  const missingMustHave = mustHaves.some(s => !candidateSet.has(normalizeSkill(s.name)));
  if (missingMustHave) {
    return { score: 0, max: 50, disqualified: true, detail: 'Missing one or more must-have skills' };
  }

  // Cleared the gate: base points for having all must-haves
  let score = 35;

  // Remaining 15 points split across nice-to-haves
  if (niceToHaves.length > 0) { 
    const pointsPerNiceToHave = 15 / niceToHaves.length;
    const matchedNiceToHaves = niceToHaves.filter(s => candidateSet.has(normalizeSkill(s.name)));
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
module.exports = { scoreSkills, scoreExperience, normalizeSkill, scoreLocation };