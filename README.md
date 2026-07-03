# GavasAmazon Admin

Admin panel for managing products, categories, orders, and users.

## Features

- Dashboard with sales overview
- Product CRUD with images, stock, MRP, and discount pricing (INR)
- Category management with logos
- Order and user management

## Setup

```bash
npm install
cp .env.example .env
# Edit .env — set VITE_STORE_URL if needed
npm run dev
```

Runs at `http://localhost:5174` by default.

## Environment

| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | API base path (default `/api`) |
| `VITE_STORE_URL` | Storefront URL (default `http://localhost:5173`) |

Admin login uses email/password configured in the backend (`ADMIN_EMAIL` / `ADMIN_PASSWORD` in server `.env`).

## Scripts

```bash
npm run dev      # Development server
npm run build    # Production build
npm run preview  # Preview production build
```

## Related repos

- [GavasAmazon](https://github.com/Jvpavankumar/GavasAmazon) — Storefront
- [GavasAmazonBackend](https://github.com/Jvpavankumar/GavasAmazonBackend) — API server
