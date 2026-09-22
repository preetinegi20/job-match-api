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
- Support recommendation limits
- PostgreSQL persistence
- Docker and Docker Compose support
- Automated tests with Jest
- GitHub Actions CI for tests and Docker validation

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

## API Endpoints

### Health Check

```http
GET /health