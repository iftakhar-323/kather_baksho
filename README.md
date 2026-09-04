# 🌿 KatherBox

> A full-stack e-commerce demo for hand-curated plants, handcrafted planters, subscriptions, expert consultations, corporate gifting, and a community-driven care journal.
> Backend in **Go + Gin + GORM + SQLite**, frontend in **React 18 + Vite + React Router v7**.

This README is the **main entry point**. For deeper docs see:

| Doc | Purpose |
|---|---|
| [`backend/README.md`](./backend/README.md) | Go API, routes, seeders, helpers |
| [`frontend/README.md`](./frontend/README.md) | React app, components, routing |
| [`DATABASE.md`](./DATABASE.md) | SQLite schema, how to inspect / reset |
| [`SETUP.md`](./SETUP.md) | Step-by-step install on a fresh machine |

---

## 1. Features

### Customer-facing
- 🛍 Product catalog with categories, search, sort, filter, pagination, gift-wrap
- 🛒 Cart, checkout, order history, order detail
- ❤️ Wishlist, ⏰ Reminders, 🎁 Gift recommendations
- 📦 Plant-box subscriptions (weekly / monthly / quarterly)
- 🌱 Expert consultations (bookable time slots)
- 🏢 Corporate gifting (bulk quotes with custom branding)
- 💬 Community Q&A + posts + likes
- 🏆 Loyalty (points, tiers, achievements, referral codes, rewards)
- 🌿 Seasonal Bangladesh planting calendar
- 📓 Care journal / growth log
- 🔔 In-app notifications + 🌓 dark mode + 🇧🇩/🇬🇧 i18n

### Admin panel (`/admin`)
- Dashboard (revenue, top customers, top products)
- Orders, returns, refunds
- Product + category CRUD
- Subscription / consultation / corporate / reminder management
- User roles + permissions
- Blog CMS, reviews moderation
- Analytics, CSV export, DB backup/restore

---

## 2. Tech stack at a glance

| Layer    | Tech                                                      |
|----------|-----------------------------------------------------------|
| Backend  | Go 1.25 · Gin · GORM · SQLite · JWT (HS256) · bcrypt     |
| Frontend | React 19 · Vite · Axios · React Router v7 · plain CSS    |
| Storage  | SQLite file (`backend/katherbox.db`) + `localStorage`     |
| Auth     | JWT in `localStorage.kb_token`; user object in `kb_user` |

See `backend/README.md` and `frontend/README.md` for the full picture.

---

## 3. Quick start (TL;DR)

### Option A: Using Docker (Recommended)

Run the full stack (Go backend + React frontend + SQLite storage + Nginx proxy) in **one command**:

```bash
docker compose up --build
```

- **Frontend**: <http://localhost> (Port 80)
- **Backend API**: <http://localhost:8081>

---

### Option B: Local Manual Setup

```bash
# 1. Backend
cd backend
go run ./cmd/resetusers/        # creates admin + customer demo accounts (idempotent)
go run ./cmd/seedproducts/      # seed products  (optional)
go run ./cmd/seeddummy/         # seed 50 each of orders/subs/etc. (optional)
go run main.go                  # API → http://localhost:8081

# 2. Frontend (in a second terminal)
cd frontend
npm install
npm run dev                     # Web → http://localhost:5173
```

Open <http://localhost:5173> (or <http://localhost> with Docker) and log in.

---

## 4. Demo accounts

| Role     | Email                  | Password         | Notes                         |
|----------|------------------------|------------------|-------------------------------|
| **Admin**| `admin@katherbox.com`  | `Admin@12345`    | Full `/admin` back-office     |
| **Staff**| `staff@katherbox.com`  | `Staff@12345`    | `/admin` limited to Orders + Returns (fulfilment role) |
| Customer | `customer@test.com`    | `Customer@12345` | Pre-loaded: 32 orders, 4 subs, 5 wishlist, 5 reviews, 4 journal entries, 2 community posts, 3 addresses, Gold loyalty tier |
| Customer | `iftakhar@gmail.com`   | `Customer@12345` | Same shape as customer@test   |
| Customer | `cust1@test.com`       | `Customer@12345` | Same                          |

> Demo data is created by `backend/cmd/seeddummy/` (50 rows per table, random user IDs 1–50). The `customer@test.com` user is then **manually topped up** with wishlist, addresses, reviews, community posts, and care-journal entries — see [`DATABASE.md`](./DATABASE.md#test-customer-account-customer-testcom).
>
> Re-run `go run ./cmd/resetusers/` any time to reset passwords back to the values above.

---

## 5. URL map (routes)

Every page has a real, shareable URL via React Router v7.

| Page | URL |
|---|---|
| Home / storefront | `/` |
| Login / Register | `/login`, `/register` |
| Profile | `/profile` |
| Admin panel | `/admin` |
| Cart / Orders / Wishlist | `/cart`, `/orders`, `/orders/:id`, `/wishlist` |
| Subscriptions / Consultations / Corporate | `/subscriptions`, `/consultations`, `/corporate`, `/corp-portal` |
| Community / Blog | `/community`, `/communityqa`, `/blog`, `/blog/:slug` |
| Loyalty / Care / Reminders / Seasonal / Gift cards | `/loyalty`, `/care`, `/reminders`, `/seasonal`, `/gift-cards` |
| Product detail | `/product/:id` (e.g. `/product/1202`) |
| Static pages | `/about`, `/contact`, `/faq`, `/privacy`, `/terms`, `/shipping`, `/refund` |

Admins are auto-redirected from customer-only pages to `/admin`.

---

## 6. Project layout

```
katherbox/
├── backend/                # Go API
│   ├── main.go
│   ├── go.mod
│   ├── katherbox.db        # SQLite (auto-created on first run)
│   ├── controllers/        # 26 HTTP handlers
│   ├── routes/             # 27 route files
│   ├── models/             # 13 GORM models
│   ├── middleware/         # JWT + admin guard
│   ├── utils/              # bcrypt + JWT helpers
│   ├── database/           # GORM connection + auto-migrate
│   └── cmd/                # One-off CLI tools
│       ├── makeadmin/      # Create / reset admin user
│       ├── resetusers/     # Reset all demo passwords
│       ├── seedproducts/   # Seed product catalog
│       ├── seeddummy/      # Seed 50 each of orders/subs/etc.
│       └── seedorders/     # Seed a single user's orders
├── frontend/               # React app
│   ├── package.json
│   ├── vite.config.js
│   └── src/
│       ├── App.jsx         # Router + global shell
│       ├── main.jsx
│       ├── api/            # Axios clients (auth, products, …)
│       ├── components/     # Reusable widgets
│       ├── context/        # AuthContext
│       ├── hooks/
│       ├── i18n/           # en.json, bn.json
│       ├── pages/          # Home, Cart, Admin, …
│       └── utils/
├── DATABASE.md             # DB schema + how to inspect
├── SETUP.md                # Install on a new machine
└── README.md               # ← you are here
```

---

## 7. Need help?

- **Backend not starting?** → [`backend/README.md`](./backend/README.md)
- **Frontend blank page?** → [`frontend/README.md`](./frontend/README.md)
- **"How do I look at the database?"** → [`DATABASE.md`](./DATABASE.md)
- **"How do I run this on another machine?"** → [`SETUP.md`](./SETUP.md)