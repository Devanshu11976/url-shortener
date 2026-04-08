<div align="center">

# 🔗 URL Shortener

### A fast, open-source URL shortener — self-hosted and developer-friendly.

![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![SQLite](https://img.shields.io/badge/SQLite-07405E?style=for-the-badge&logo=sqlite&logoColor=white)
![Express](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)

[Features](#-features) · [Quick Start](#-quick-start) · [API Reference](#-api-reference) · [Roadmap](#-roadmap) · [Contributing](#-contributing)

</div>

---

## ✨ Features

| Feature | Description |
|--------|-------------|
| 🔗 **Shorten URLs** | Convert any long URL into a short, shareable link |
| ✏️ **Custom Aliases** | Choose your own slug (e.g. `/my-link`) |
| ⏳ **Expiration Dates** | Set links to auto-expire at a specific date and time |
| 📊 **Click Analytics** | Track how many times a link has been clicked and when |
| ↩️ **Instant Redirects** | Fast `302` redirects for every short code |
| 🖥️ **React Frontend** | Clean UI powered by React + Vite |
| 🛠️ **REST API** | Fully documented API for integration with any app |

---

## 🚀 Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) v18+
- npm

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/Devanshu11976/url-shortener.git
cd url-shortener

# 2. Install dependencies
npm install

# 3. Set up environment variables
copy .env.example .env   # Windows
# cp .env.example .env   # Mac/Linux

# 4. Start development servers
npm run dev
```

| Service | URL |
|--------|-----|
| 🖥️ Frontend (React + Vite) | http://localhost:5173 |
| ⚙️ Backend API (Express) | http://localhost:3000 |

> **Production build:**  Run `npm run build:web` to build the frontend. The backend will then serve it at `http://localhost:3000/`.

---

## 📡 API Reference

### Health Check

```http
GET /health
```

**Response:**
```json
{ "ok": true }
```

---

### Create a Short URL

```http
POST /shorten
```

**Request Body:**

```json
{
  "url": "https://example.com/very/long/path",
  "customAlias": "my-link",
  "expiresAt": "2026-12-31T23:59:59.000Z"
}
```

> `customAlias` and `expiresAt` are optional.

**Response:**

```json
{
  "code": "my-link",
  "shortUrl": "http://localhost:3000/my-link",
  "longUrl": "https://example.com/very/long/path",
  "expiresAt": "2026-12-31T23:59:59.000Z"
}
```

---

### Redirect

```http
GET /:code
```

Returns a `302` redirect to the original URL if the code is valid and not expired.

---

### Get Link Stats

```http
GET /stats/:code
```

**Response:**

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

---

## 🗺️ Roadmap

Things I'd love to build next:

- [ ] 🚦 Rate limiting on `POST /shorten`
- [ ] 🧪 Unit & integration tests
- [ ] 👤 User accounts & private links
- [ ] 🌍 Richer analytics (referrers, countries, devices)
- [ ] 🔒 Password-protected links
- [ ] 📈 Dashboard with charts and insights
- [ ] 🐳 Docker support

---

## 🤝 Contributing

Contributions are very welcome! Here's how to get started:

1. **Fork** this repository
2. **Create** a feature branch: `git checkout -b feature/my-feature`
3. **Commit** your changes: `git commit -m 'Add my feature'`
4. **Push** to the branch: `git push origin feature/my-feature`
5. **Open** a Pull Request with a clear description of what you changed and why

### 💡 Good First Issues

Looking for somewhere to start? Try one of these:

- 🐛 Bug fixes
- 🎨 UI/UX improvements
- 📊 Better analytics & dashboards
- ⚡ Performance improvements
- 📖 Docs and usage examples

---

## 📁 Project Structure

```
url-shortener/
├── src/                          # React frontend (Vite + TypeScript)
│   └── app/components/
│       └── URLShortenerForm.tsx  # Main shortener form component
├── data/                         # SQLite database storage
├── dist/                         # Production build output
├── .env.example                  # Environment variable template
├── index.html
├── package.json
├── postcss.config.mjs
└── vite.config.mts
```

---

## 📄 License

Copyright © 2026 Devanshu Sharma.

This project is licensed under the **MIT License** — you are free to use, modify, and distribute this software, provided the original copyright notice is included.

See the [LICENSE](./LICENSE) file for full details.

---

<div align="center">

Made with ❤️ by **Devanshu Sharma** · [Report a Bug](https://github.com/Devanshu11976/url-shortener/issues/new?template=bug_report.md) · [Request a Feature](https://github.com/Devanshu11976/url-shortener/issues/new?template=feature_request.md) · [⭐ Star this repo](https://github.com/Devanshu11976/url-shortener)

</div>