## Disclaimer

This project is created for educational, research, and portfolio purposes only. It is an independent implementation and is not affiliated with or endorsed by any brokerage company. No proprietary logos, trademarks, or copyrighted assets are included. This project does not provide real trading or financial services.

# TradeCore Portal

Educational full-stack trading **client portal** (demo / portfolio).  
Not a real broker. No real money, no real market execution.

![Trading Terminal](screenshots/treadcore_portal_terminal.jpg)
![Dashboard](screenshots/treadcore_portal_dashbord.jpg)
![Admin Dashboard](screenshots/treadcore_portal_admin_dashbord.jpg)

## Status

**In progress — portfolio project**

| Area | Status |
|------|--------|
| Next.js frontend (`frontend/`) | Active |
| NestJS API (`backend/`) | Active |
| Auth (JWT) | Backend ready — wire end-to-end if not fully connected |
| Wallet / deposit / withdraw / KYC modules | Backend structure present |
| Live demo | Coming soon / add URL here |
| Tests & CI | Planned |

## Tech stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js, React, TypeScript, Tailwind, TanStack Query, Zustand |
| Backend | NestJS, Prisma, PostgreSQL |
| Cache / jobs | Redis (Docker Compose) |
| Charts | lightweight-charts |
| API style | REST (`/api/v1`), Swagger on backend |

> Main app code: **`frontend/`** + **`backend/`**.  
> Root-level Vite files (if any) are legacy prototype — not the primary app.

## Features

- User dashboard (balance, accounts, recent activity)
- Trading terminal UI (charts, order panel)
- Admin panel UI (users, KYC, deposits, withdrawals)
- Auth module (register / login JWT on API)
- Wallet, ledger, deposit & withdrawal flows (API modules)
- File upload foundation for KYC / proofs

## Project structure

```text
tradecore-portal/
├── frontend/          # Next.js app
├── backend/           # NestJS + Prisma
├── screenshots/       # README images
└── README.md
