const { scoreSkills, scoreExperience  } = require('../src/services/scoringService');

describe('scoreSkills', () => {
  test('disqualifies candidate missing a must-have skill', () => {
    const result = scoreSkills(
      ['JavaScript'],
      [{ name: 'Node.js', mustHave: true }]
    );
    expect(result.disqualified).toBe(true);
    expect(result.score).toBe(0);
  });

  test('gives full score when all must-haves met and no nice-to-haves', () => {
    const result = scoreSkills(
      ['Node.js', 'PostgreSQL'],
      [{ name: 'Node.js', mustHave: true }, { name: 'PostgreSQL', mustHave: true }]
    );
    expect(result.disqualified).toBe(false);
    expect(result.score).toBe(50);
  });

  test('gives partial nice-to-have credit', () => {
    const result = scoreSkills(
      ['Node.js', 'Docker'],
      [
        { name: 'Node.js', mustHave: true },
        { name: 'Docker', mustHave: false },
        { name: 'Kubernetes', mustHave: false },
      ]
    );
    // base 35 + 1 of 2 nice-to-haves (7.5 pts) = 42.5 -> rounds to 43 or 42
    expect(result.disqualified).toBe(false);
    expect(result.score).toBeGreaterThan(35);
    expect(result.score).toBeLessThan(50);
  });

  test('is case-insensitive when matching skills', () => {
    const result = scoreSkills(
      ['javascript'],
      [{ name: 'JavaScript', mustHave: true }]
    );
    expect(result.disqualified).toBe(false);
  });
});


describe('scoreExperience', () => {
  test('gives full score when candidate meets minimum experience', () => {
    const result = scoreExperience(5, 3);
    expect(result.score).toBe(20);
  });

  test('gives full score when candidate exactly meets minimum', () => {
    const result = scoreExperience(3, 3);
    expect(result.score).toBe(20);
  });

  test('penalizes but does not zero out a candidate slightly under minimum', () => {
    const result = scoreExperience(3, 5); // 2 years short
    expect(result.score).toBe(12); // 20 - (2*4)
    expect(result.score).toBeGreaterThan(0);
  });

  test('never goes below zero even when very under-qualified', () => {
    const result = scoreExperience(0, 10); // 10 years short, would be negative
    expect(result.score).toBe(0);
  });
});