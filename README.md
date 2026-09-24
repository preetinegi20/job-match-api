# Job Match API

A backend API that recommends and ranks jobs for candidates based on skills, experience, location, and salary expectations.

The recommendation engine uses a deterministic scoring system rather than machine learning, making the matching logic transparent, explainable, and easy to test.

## Features

- Create candidates
- Create jobs with must-have and nice-to-have skills
- Recommend jobs for a candidate
- Find candidates recommended for a job
- Hard-filter jobs when a must-have skill is missing
- Rank matches using a 0–100 scoring system
- Provide a score breakdown for each matching dimension
- Support recommendation limits (`?limit=`, server-side clamped to a max of 100)
- Configurable scoring weights via query param
- Structured, consistent error responses (`{ code, message, details }`)
- PostgreSQL persistence, with jobs+skills joined via a single SQL `LEFT JOIN`
- Docker and Docker Compose support
- Automated tests with Jest (23 tests covering the scoring engine)
- GitHub Actions CI for Docker build validation

## Tech Stack

- Node.js
- Express.js
- PostgreSQL
- Jest
- Supertest
- Docker
- Docker Compose
- GitHub Actions

---

## How to Run Locally

### Prerequisites
- Node.js (v18+)
- PostgreSQL (v14+) installed and running locally
- npm

### Setup

1. Clone the repo:
```bash
git clone https://github.com/preetinegi20/job-match-api.git
cd job-match-api
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the project root:
```
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_postgres_password
DB_NAME=jobmatchdb
```

4. Create the database and load the schema:
```bash
psql -U postgres -c "CREATE DATABASE jobmatchdb;"
psql -U postgres -d jobmatchdb -f src/db/schema.sql
```

5. Start the server:
```bash
npm run dev
```

6. Confirm it's running:
```bash
curl http://localhost:3000/health
curl http://localhost:3000/health/db
```

### Running Tests

```bash
npm test
```

This runs the Jest test suite, covering the scoring engine (`tests/scoringService.test.js`) — 23 tests across skill matching (including must-have disqualification, nice-to-have credit, whitespace/case handling), experience penalties, location tiers, salary interpolation (including a fixed-rate salary edge case that previously caused a division-by-zero), configurable weight overrides, and combined scoring scenarios.

---

## Running with Docker

A `Dockerfile` and `docker-compose.yml` are included, defining two services: the API and a Postgres database, networked together.

```bash
docker compose up --build
```

This builds the API image, starts Postgres, and runs the app connected to it — no local `.env` or native Postgres install needed, since environment variables are set directly in `docker-compose.yml` for this setup.

**Note on Docker testing:** local development happened primarily on a machine without reliable Docker support. Rather than skip this bonus, the Docker build and startup are verified automatically via GitHub Actions on every push — see `.github/workflows/docker-build.yml`, which builds the image, brings up both containers via `docker compose`, and confirms the API responds on `/health` before tearing down. This workflow is currently passing on every commit — see the Actions tab on the repo for current status.

---

## API Reference

### `POST /candidates`
Create a candidate profile.

**Body:**
```json
{
  "name": "Aman",
  "skills": ["Node", "javascript", "SQL", "Redis", "Docker"],
  "yearsExperience": 4,
  "location": "Bangalore",
  "expectedSalary": 3000000
}
```

`skills` is validated as a non-empty array — a string or missing value returns a `400`.

### `POST /jobs`
Create a job posting.

**Body:**
```json
{
  "title": "SDE-2",
  "minYearsExperience": 3,
  "location": "Bangalore",
  "salaryMin": 3000000,
  "salaryMax": 4000000,
  "remoteAllowed": true,
  "requiredSkills": [
    { "name": "javascript", "mustHave": true },
    { "name": "Node", "mustHave": true },
    { "name": "Docker", "mustHave": false }
  ]
}
```

### `GET /candidates/:id/recommendations?limit=10&weights={}`
Ranked list of jobs for a candidate.

**Query params:**
- `limit` (optional, default 10, max 100) — number of results, clamped server-side regardless of the requested value
- `weights` (optional, JSON string) — override default scoring weights, e.g. `?weights={"salary":{"max":30}}`

**Response:**
```json
[
  {
    "jobId": 4,
    "title": "SDE-2",
    "overallScore": 94,
    "breakdown": {
      "skills": { "score": 50, "max": 50 },
      "experience": { "score": 20, "max": 20 },
      "location": { "score": 9, "max": 15 },
      "salary": { "score": 15, "max": 15 }
    }
  }
]
```

### `GET /jobs/:id/recommendations?limit=10&weights={}` (bonus)
Reverse view — ranked list of candidates for a job. Same query params and response shape, with `candidateId`/`name` instead of `jobId`/`title`.

### Error responses

All error responses use a consistent structured shape:
```json
{
  "code": "CANDIDATE_NOT_FOUND",
  "message": "Candidate not found",
  "details": []
}
```

---

## Scoring Formula & Reasoning

Each job recommendation is scored out of **100 points**, split across four dimensions:

| Dimension | Points | Why this weight |
|---|---|---|
| Skills | 50 | The primary signal for whether a candidate can actually do the job |
| Experience | 20 | Important, but more about readiness than core capability |
| Location | 15 | Logistical fit — matters, but secondary to whether the candidate can do the work |
| Salary | 15 | Logistical fit — whether the arrangement is financially workable |

Skills carries the most weight because it's the closest proxy for "can this person do the job," which is the fundamental question a recommendation engine should answer first. The remaining three dimensions are all real factors, but they're about fit and logistics rather than raw capability, so together they make up the other half.

### Must-have skills — a hard filter, not a score

Before any scoring happens, every job is checked for must-have skills. If the candidate is missing even one, the job is excluded from their recommendations entirely — it isn't scored low, it simply never appears. No amount of strength elsewhere (perfect experience, perfect salary fit) can compensate for a missing must-have.

### Skills scoring (50 points)

If a candidate clears the must-have gate, they automatically receive **35 of the 50 points** just for having every required skill. The remaining **15 points** are distributed evenly across the job's nice-to-have skills — e.g. a job with 3 nice-to-haves awards 5 points for each one matched. If a job lists no nice-to-have skills at all, the candidate receives the full 50 rather than being capped at 35. Skill names are compared case-insensitively and trimmed of whitespace.

### Experience scoring (20 points)

If the candidate's years meet or exceed the job's minimum, they receive the full 20 points. If they fall short, they lose 4 points per year under the minimum, floored at 0 — never excluded outright, only penalized. A linear penalty was chosen over a hard cutoff because it's simple to explain and avoids an arbitrary boundary.

### Location scoring (15 points)

Three tiers: exact match = 15, no match but `remoteAllowed = true` = 9, neither = 0. This ordering reflects that in-person proximity is the strongest fit, remote work is a solid fallback, and a mismatch with no remote option is effectively a non-fit.

### Salary scoring (15 points)

- Job's maximum below candidate's expectation → 0 (can't meet expectation).
- Job's minimum already meets/exceeds expectation → 15 (comfortably affordable).
- Otherwise, interpolate: `15 × (jobMax − expectedSalary) / (jobMax − jobMin)` — the closer the expectation sits to the low end of the range, the higher the score.
- **Edge case:** if `salaryMin === salaryMax` (a fixed-rate posting) and the rate is above the candidate's expectation, the job scores the full 15 rather than dividing by zero. This was caught during a self-review pass and covered with a dedicated test.

**Worked example:** A candidate expecting ₹12,00,000 against a job paying ₹10,00,000–₹15,00,000 scores `15 × (1,500,000 − 1,200,000) / (1,500,000 − 1,000,000) = 9`.

### End-to-end example

Candidate "Aman" (4 years, Bangalore, expects ₹30,00,000) vs. "SDE-2" (needs 3+ years, Bangalore, remote allowed, pays ₹30,00,000–₹40,00,000, all required skills present):

```
skills:     50/50  (all must-haves present, all nice-to-haves matched)
experience: 20/20  (4 years ≥ 3 years required)
location:    9/15  (job location had a data-entry typo — fell to remote-allowed tier)
salary:     15/15  (job's minimum already meets expectation)
------------------
overall:    94/100
```

This example also surfaced a real limitation: location matching is exact-string, so a typo in job data (e.g. "Banglore" vs "Bangalore") causes a fallback to the remote tier instead of a full match — a known tradeoff, see below.

### Configurable weights (bonus)

Every scoring function accepts an optional weights argument, defaulting to the values above. Callers can override any subset via the `weights` query param (JSON), e.g. `?weights={"skills":{"max":60}}` — only the specified fields are overridden, everything else falls back to defaults. Invalid or malformed JSON in the `weights` param is silently ignored, falling back to defaults, rather than causing a request failure.

---

## Assumptions & What I'd Do Differently With More Time

- **Skill matching is exact (after normalization).** "JavaScript" and "javascript" are treated as the same skill, but "JS" and "JavaScript" are not, and "React" vs "React.js" are treated as different skills. With more time, I'd add a synonym/alias list or fuzzy matching.
- **Location matching is exact-string, not fuzzy or geographic.** A typo or alternate spelling (e.g. "Bangalore" vs "Bengaluru") is treated as a full mismatch. I'd add normalization or a geocoding-based distance check with more time.
- **No pagination beyond `limit`.** I'd add offset/cursor-based pagination for large result sets, on top of the existing server-side max clamp.
- **Input validation is manual** (checking required fields directly in controllers, including array-type checks for `skills`/`requiredSkills`). I'd use a schema validation library (e.g. Zod or Joi) for more robust, declarative validation with more time.
- **No authentication**, per the assignment's explicit scope.
- **Docker was not fully verified locally** due to hardware constraints on the primary dev machine — verified instead via GitHub Actions CI on every push.

## Why Rule-Based, Not ML

The assignment explicitly calls for a transparent, explainable scorer rather than a black box. A rule-based system means every score can be broken down and justified dimension by dimension, which matters for something like job matching, where fairness and explainability are important — a candidate or recruiter can see exactly why a score is what it is.

---

## AI Tool Usage

I used Claude (Anthropic) throughout this project for:
- Scaffolding the initial project structure and folder layout
- Working through the scoring formula's weighting logic and reasoning
- Designing the GitHub Actions workflow to build the Docker image and validate the container starts correctly, since my local machine couldn't reliably run Docker Desktop 
- The same review flagged missing input validation (a non-array `skills` field would previously reach the database and throw an unhandled error instead of a clean `400`), which I fixed by validating with `Array.isArray()` and a non-empty check.

All logic — the scoring functions, database schema, controllers, and tests — was written, reviewed, and tested by me. One specific place I caught and corrected an issue myself: after refactoring the database queries to alias columns to camelCase directly in SQL, I found the recommendation controller's helper functions were still mapping to the old snake_case property names, silently producing `NaN` scores. I diagnosed this by inspecting the raw database rows and tracing the property names through each layer, rather than accepting the first suggested fix.

---

## Project Structure

```
job-match-api/
├── .github/workflows/     # CI: Docker build validation
├── src/
│   ├── controllers/       # Request handling, validation, response shaping
│   ├── models/             # Database queries (SQL joins, camelCase aliasing)
│   ├── routes/              # Route definitions
│   ├── services/            # Scoring engine (core business logic)
│   ├── db/                  # DB connection pool + schema
│   └── index.js             # App entry point
├── tests/                 # Jest tests (scoring logic — 23 tests)
├── Dockerfile
├── docker-compose.yml
└── README.md
```