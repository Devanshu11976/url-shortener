# URL Shortener Starter

Simple URL shortener API using Node.js, Express, and SQLite.

## Features

- Create short URLs from long URLs
- Optional custom aliases
- Optional expiration date
- Redirect using short code
- Basic click analytics

## Quick Start

1. Install dependencies:

```bash
npm install
```

2. Copy env file:

```bash
copy .env.example .env
```

3. Run development servers (API + frontend):

```bash
npm run dev
```

Frontend runs on `http://localhost:5173` and API on `http://localhost:3000`.

## Frontend

In development, open `http://localhost:5173/` to use the React UI.
After `npm run build:web`, the backend serves the built frontend at `http://localhost:3000/`.

## API

### Health Check

- `GET /health`

Response:

```json
{ "ok": true }
```

### Create Short URL

- `POST /shorten`
- Body:

```json
{
  "url": "https://example.com/very/long/path",
  "customAlias": "my-link",
  "expiresAt": "2026-12-31T23:59:59.000Z"
}
```

`customAlias` and `expiresAt` are optional.

Response:

```json
{
  "code": "my-link",
  "shortUrl": "http://localhost:3000/my-link",
  "longUrl": "https://example.com/very/long/path",
  "expiresAt": "2026-12-31T23:59:59.000Z"
}
```

### Redirect

- `GET /:code`
- Returns a `302` redirect if found.

### Stats

- `GET /stats/:code`

Response:

```json
{
  "code": "my-link",
  "longUrl": "https://example.com/very/long/path",
  "createdAt": "2026-04-07 10:00:00",
  "expiresAt": null,
  "clickCount": 3,
  "lastClickedAt": "2026-04-07 10:05:00"
}
```

## Next Up (Recommended)

- Add rate limiting to `POST /shorten`
- Add unit/integration tests
- Add user accounts and private links
- Add a small frontend page for shortening URLs
