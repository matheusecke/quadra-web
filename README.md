# Quadra Web

Web frontend for Quadra, a multi-tenant platform for organizing and tracking basketball championships: organizations, teams, athletes, tournaments, matches, and statistics.

Built with React 19, TypeScript, and Vite.

## Installation

Requires Node.js 22+, npm, and the [Quadra API](https://github.com/matheusecke/quadra-api) running.

```bash
npm ci
```

Create a `.env.local` file in the project root:

```env
VITE_API_URL=http://localhost:3001
```

## Usage

```bash
npm run dev
```

The app is available at `http://localhost:5173`.

```bash
npm run build     # production build
npm test          # tests
npm run lint
```

### Docker

This is how the frontend currently runs day to day. The repo has its own `docker-compose.yml`, which builds the image from `Dockerfile.local`. It doesn't depend on any other container — it just expects the API to be reachable at `http://localhost:3001` (local or via [quadra-api](https://github.com/matheusecke/quadra-api) in Docker):

```bash
docker compose up --build
```

The app stays available at `http://localhost:5173`.

## Examples

With the API running, open `http://localhost:5173` and log in with an existing user to browse the organization's teams, tournaments, and matches.

## License

All rights reserved — see [LICENSE](LICENSE). Public for academic evaluation and portfolio purposes (TCC); not licensed for external use.
