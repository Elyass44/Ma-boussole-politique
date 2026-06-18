# Ma boussole politique

Discover which French parliamentary groups align most with your political views — based on **real votes** at the Assemblée nationale (17th legislature).

Answer 15, 30, or 50 questions. Each question is an actual vote that took place in parliament. At the end, see your score per group and where you land on the left–right axis.

## How it works

- Votes are fetched from [CIVIX](https://www.civix.fr), which aggregates open data from the Assemblée nationale
- Each question is summarized by an AI (Mistral) with the actual amendment text when available
- Scoring: for each group, the majority position is compared to your answer. Final score = matches / answered questions
- The left–right axis is a weighted average of group positions, weighted by concordance score

## Stack

| Layer | Tech |
|---|---|
| Frontend | React + Vite + Tailwind CSS |
| Backend | Node.js + Express |
| Database | SQLite (`better-sqlite3`) |
| AI summaries | Mistral API (`mistral-small-latest`) |
| Data source | CIVIX API / Assemblée nationale open data |
| Deployment | Docker Compose |

## Getting started

```bash
cp .env.example .env   # add your MISTRAL_KEY
make start             # docker compose up
```

App runs at `http://localhost:5174`.

To refresh the scrutins cache manually:

```bash
docker exec poliquiz-backend-1 node /app/refresh.js
```

Schedule weekly with a cron:

```
0 3 * * 1  docker exec poliquiz-backend-1 node /app/refresh.js
```

## License

AGPL-3.0 — see [LICENSE](./LICENSE).
