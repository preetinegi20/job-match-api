const { scoreSkills } = require('../src/services/scoringService');

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