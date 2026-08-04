# SmartRec

**Describe what you need. Get tech that fits — ranked against your budget, brand, and use-case — from a built-in laptop catalog.**

SmartRec is a full-stack product-recommendation app. A natural-language parser understands queries like _"samsung phones under 10k"_ or _"laptop for coding under 40k"_, and a scoring engine explains _why_ each pick fits. All results are served from a local, offline catalog — there is no external API dependency.

---

## Highlights

- 🧠 **Natural-language search** — budget (`under 40k`, `₹45,000`, `around 1 lakh`), brand, device type, and use-case intent (coding, gaming, photography, teaching, battery, student, travel) parsed server-side.
- 🎯 **Explainable scoring** — every product carries a human-readable _"Why SmartRec picked this"_ reason derived from matched specs.
- 📦 **Offline-only, zero external dependencies** — every search is served from the bundled `laptop.csv` catalog, in-memory. No API key, no quota, no network call, no cost.
- ⚖️ **Compare mode** — side-by-side spec comparison for up to 3 picks.
- 🔖 **Saved products** — localStorage-backed favorites.
- 🧪 **Tested** — unit, integration, and component tests across parser, scoring, catalog, API, and UI.
- 📱 **Mobile responsive** — fluid grid, touch targets, and reduced-motion support.

## Architecture

```
┌────────────────────────────────────────────────────────────┐
│  React + Vite + Tailwind (src/)                           │
│  SearchBox · ProductCard · ProductModal · CompareModal     │
│  FavoritesDrawer · ResultsToolbar · useProducts · useFavs  │
└──────────────────────────┬─────────────────────────────────┘
                           │ /api/products?q=…
┌──────────────────────────▼─────────────────────────────────┐
│  Express API (server/)                                     │
│  ┌───────────┐   ┌────────────┐   ┌────────────────────┐  │
│  │  parse    │ → │   score    │ → │   catalog search   │  │
│  │ query.js  │   │ scoring.js │   │  in-memory cache →  │  │
│  │ NLP budget│   │ intent     │   │  catalog (csv)      │  │
│  │ brand,type│   │ reasons    │   │  cache.js (TTL)     │  │
│  └───────────┘   └────────────┘   └────────────────────┘  │
└────────────────────────────────────────────────────────────┘
```

## Tech stack

| Layer    | Tools                                                     |
| -------- | ---------------------------------------------------------- |
| Frontend | React 19, Vite, Tailwind CSS 4, lucide-react               |
| Backend  | Node.js, Express 5, Helmet (security headers)              |
| Data     | In-memory TTL cache, `laptop.csv` offline catalog          |
| Quality  | Vitest, Testing Library, Supertest, ESLint, Prettier       |
| Ops      | Docker, docker-compose, GitHub Actions CI                  |

## Getting started

### Prerequisites

- Node.js 20+
- [pnpm](https://pnpm.io)

### Run locally

```bash
# 1. configure the environment
cp .env.example .env

# 2. install & start
pnpm install
pnpm dev                    # API on :3001, Vite on :5173
```

Open http://localhost:5173 and search:

- `laptop for coding under 40k`
- `₹45,000 gaming laptop with 16gb ram`
- `lightweight laptop for travel around 60k`

> **Note:** search is currently scoped to the `laptop.csv` catalog only. Non-laptop queries (phones, tablets, accessories) will return no matches until the catalog is expanded — see the note in the improvements report about this being a known limitation, not a bug.

### Production

```bash
pnpm build                  # builds dist/
pnpm start                  # serves API + dist on :3001
```

Or with Docker:

```bash
docker compose up --build
```

## API reference

| Endpoint                      | Description                                                                                                |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `GET /api/products?q=<query>` | Ranked recommendations. Returns `products`, `parsed`, `mode` (`live` \| `catalog`), `cached`, and `quota`. |
| `GET /api/health`             | Liveness probe: `status`, `uptime`.                                                                        |
| `GET /api/health/status`      | Runtime stats: quota usage, cache size, catalog size, config state.                                        |

Example response:

```json
{
  "products": [
    {
      "id": "catalog-0",
      "name": "Zebronics …",
      "price": 32990,
      "rating": 3.2,
      "reason": "Its RAM and processor are a strong fit …"
    }
  ],
  "parsed": {
    "text": "laptop for coding under 40k",
    "type": "laptop",
    "maxPrice": 40000,
    "intent": ["coding"],
    "brand": null
  },
  "mode": "catalog",
  "cached": false,
  "quota": { "month": "2026-08", "usedThisMonth": 0, "remaining": 250 }
}
```

## The recommendation engine

1. **Parse** (`server/query.js`) — extracts budget (with `k`/`lakh`/`₹` units and a soft-cap for "around"), brand, device type, and intents.
2. **Filter** — strict guards on type, brand, and price ceiling.
3. **Score** (`server/scoring.js`) — intent profiles award points for matched specs (RAM/CPU for coding, GPU/refresh for gaming, mAh for battery, camera for photography…), plus a rating bonus.
4. **Rank & explain** — sort by score, then attach a readable reason.

## Quota & resilience design

- Each normalized query is cached for **5 minutes**; repeat searches never hit the provider.
- The 250/month free-tier budget is persisted to `.data/quota.json`, so a server restart can't reset it.
- When the key is missing, the quota is spent, or the provider errors, the API transparently serves the offline catalog and the UI shows a `catalog` mode badge.

## Project structure

```
.
├── server/            Express API
│   ├── app.js         app assembly, middleware, security
│   ├── index.js       bootstrap
│   ├── config.js      environment validation
│   ├── logger.js      structured logging
│   ├── cache.js       in-memory TTL cache for repeated queries
│   ├── query.js       NLP parser & matcher
│   ├── scoring.js     intent scoring + reasons
│   ├── catalog.js     RFC4180 CSV loader
│   └── routes/        products + health routers
├── src/               React frontend
│   ├── App.jsx
│   ├── components/    Header, Hero, SearchBox, ProductCard, …
│   ├── hooks/         useProducts, useFavorites
│   └── utils/         money formatter
├── test/              unit, API, and component tests
├── laptop.csv         920-entry India laptop dataset (sole product source)
└── docker-compose.yml, Dockerfile, .github/workflows/ci.yml
```

## Commands

| Command           | Purpose                         |
| ----------------- | ------------------------------- |
| `pnpm dev`        | Run API + Vite dev server       |
| `pnpm build`      | Build the browser bundle        |
| `pnpm start`      | Serve the production build      |
| `pnpm test`       | Run all tests once              |
| `pnpm test:watch` | Run tests in watch mode         |
| `pnpm lint`       | ESLint                          |
| `pnpm format`     | Prettier write                  |
| `pnpm check`      | Lint + test + build in one pass |

## Roadmap

- [ ] ML scoring layer trained on `laptop.csv` (see `trainer.py` scratchpad)
- [ ] Price-drop alerts for saved products
- [ ] Real-time provider status + quota meter in the UI
- [ ] PWA install + offline shell

## License

[MIT](./LICENSE)
