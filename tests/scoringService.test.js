const {
  scoreSkills,
  scoreExperience,
  scoreLocation,
  scoreSalary,
  scoreJob,
} = require("../src/services/scoringService");

describe("scoreSkills", () => {
  test("disqualifies candidate missing a must-have skill", () => {
    const result = scoreSkills(
      ["JavaScript"],
      [{ name: "Node.js", mustHave: true }]
    );
    expect(result.disqualified).toBe(true);
    expect(result.score).toBe(0);
  });

  test("gives full score when all must-haves met and no nice-to-haves", () => {
    const result = scoreSkills(
      ["Node.js", "PostgreSQL"],
      [
        { name: "Node.js", mustHave: true },
        { name: "PostgreSQL", mustHave: true },
      ]
    );
    expect(result.disqualified).toBe(false);
    expect(result.score).toBe(50);
  });

  test("gives partial nice-to-have credit", () => {
    const result = scoreSkills(
      ["Node.js", "Docker"],
      [
        { name: "Node.js", mustHave: true },
        { name: "Docker", mustHave: false },
        { name: "Kubernetes", mustHave: false },
      ]
    );
    // base 35 + 1 of 2 nice-to-haves (7.5 pts) = 42.5 -> rounds to 43 or 42
    expect(result.disqualified).toBe(false);
    expect(result.score).toBeGreaterThan(35);
    expect(result.score).toBeLessThan(50);
  });

  test("is case-insensitive when matching skills", () => {
    const result = scoreSkills(
      ["javascript"],
      [{ name: "JavaScript", mustHave: true }]
    );
    expect(result.disqualified).toBe(false);
  });
});

describe("scoreExperience", () => {
  test("gives full score when candidate meets minimum experience", () => {
    const result = scoreExperience(5, 3);
    expect(result.score).toBe(20);
  });

  test("gives full score when candidate exactly meets minimum", () => {
    const result = scoreExperience(3, 3);
    expect(result.score).toBe(20);
  });

  test("penalizes but does not zero out a candidate slightly under minimum", () => {
    const result = scoreExperience(3, 5); // 2 years short
    expect(result.score).toBe(12); // 20 - (2*4)
    expect(result.score).toBeGreaterThan(0);
  });

  test("never goes below zero even when very under-qualified", () => {
    const result = scoreExperience(0, 10); // 10 years short, would be negative
    expect(result.score).toBe(0);
  });
});

describe("scoreLocation", () => {
  test("gives full score on exact location match", () => {
    const result = scoreLocation("Bangalore", "Bangalore", false);
    expect(result.score).toBe(15);
  });

  test("is case and whitespace insensitive", () => {
    const result = scoreLocation(" bangalore ", "Bangalore", false);
    expect(result.score).toBe(15);
  });

  test("gives partial credit when remote allowed but location differs", () => {
    const result = scoreLocation("Hyderabad", "Bangalore", true);
    expect(result.score).toBe(9);
  });

  test("gives zero when location differs and remote not allowed", () => {
    const result = scoreLocation("Hyderabad", "Bangalore", false);
    expect(result.score).toBe(0);
  });
});

describe("scoreSalary", () => {
  test("gives zero when job max is below candidate expectation", () => {
    const result = scoreSalary(1500000, 1000000, 1300000);
    expect(result.score).toBe(0);
  });

  test("gives full score when job min already meets or exceeds expectation", () => {
    const result = scoreSalary(1000000, 1200000, 1500000);
    expect(result.score).toBe(15);
  });

  test("gives full score when job min exactly equals expectation", () => {
    const result = scoreSalary(1200000, 1200000, 1500000);
    expect(result.score).toBe(15);
  });

  test("interpolates when expectation falls inside the range", () => {
    const result = scoreSalary(1200000, 1000000, 1500000);
    expect(result.score).toBe(9); // 15 * (300000/500000)
  });

  test("scores near zero when expectation sits right at the max", () => {
    const result = scoreSalary(1500000, 1000000, 1500000);
    expect(result.score).toBe(0);
  });
  test('gives full score for a fixed-rate job without dividing by zero', () => {
  const result = scoreSalary(1000000, 1500000, 1500000); // salaryMin === salaryMax
  expect(result.score).toBe(15);
  expect(Number.isNaN(result.score)).toBe(false);
});
});

describe("scoreJob", () => {
  const goodCandidate = {
    skills: ["Node.js", "PostgreSQL", "Docker"],
    yearsExperience: 4,
    location: "Bangalore",
    expectedSalary: 1300000,
  };

  const job = {
    requiredSkills: [
      { name: "Node.js", mustHave: true },
      { name: "PostgreSQL", mustHave: true },
      { name: "Docker", mustHave: false },
    ],
    minYearsExperience: 3,
    location: "Bangalore",
    remoteAllowed: false,
    salaryMin: 1200000,
    salaryMax: 1600000,
  };

  test("scores a strong match highly across all dimensions", () => {
    const result = scoreJob(goodCandidate, job);
    expect(result.disqualified).toBe(false);
    expect(result.overallScore).toBeGreaterThan(85);
    expect(result.breakdown.skills.score).toBe(50);
    expect(result.breakdown.experience.score).toBe(20);
    expect(result.breakdown.location.score).toBe(15);
  });

  test("disqualifies when candidate lacks a must-have skill, regardless of other strengths", () => {
    const weakCandidate = { ...goodCandidate, skills: ["Python"] };
    const result = scoreJob(weakCandidate, job);
    expect(result.disqualified).toBe(true);
    expect(result.overallScore).toBe(0);
  });
});
