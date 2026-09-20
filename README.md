# 🌿 Kather Baksho (কাঠের বাক্স)
### High-Performance, Resilient Full-Stack E-Commerce & Botanical Platform

> **100% Local Enterprise Architecture** built with **Go (Gin + GORM)**, **React 18 (Vite + React Router v7)**, **SQLite / PostgreSQL**, **Redis In-Memory Caching**, **Prometheus & Grafana Observability**, **Atomic Concurrency Control**, **Payment Idempotency**, **AI Plant Doctor**, and **Interactive Algorithm Visualizers**.

[![Backend Tests](https://img.shields.io/badge/Go%20Unit%20Tests-Passing-brightgreen)](https://github.com/iftakhar-323/kather_baksho)
[![E2E Tests](https://img.shields.io/badge/E2E%20Regression-40%2F40%20Passing-success)](https://github.com/iftakhar-323/kather_baksho)
[![Docker Compose](https://img.shields.io/badge/Docker%20Compose-Ready-blue)](https://github.com/iftakhar-323/kather_baksho)

---

## 🚀 1-Command Quickstart (100% Localhost)

Run the complete multi-service stack (Frontend, Backend, Redis, Prometheus, Grafana) with one command:

```bash
git clone https://github.com/iftakhar-323/kather_baksho.git
cd kather_baksho
./run.sh
```

*(Alternatively, you can also run `docker compose up -d --build`)*

### 🌐 Local Service Map & Credentials

| Service | Local URL | Description | Default Credentials |
| :--- | :--- | :--- | :--- |
| **Frontend Web App** | [http://localhost:8082](http://localhost:8082) | Storefront, Customer Portal, Admin Panel, AI Doctor & Algorithm Studio | Public / Demo User |
| **Algorithm Studio** | [http://localhost:8082/algorithms](http://localhost:8082/algorithms) | Interactive Dijkstra Routing & Bin Packing Visualizer | Direct Navigation |
| **Backend REST API** | [http://localhost:8081](http://localhost:8081) | High-throughput Go REST API with CORS, Metrics & Caching | `admin@katherbox.com` / `Admin@12345` |
| **Prometheus Telemetry** | [http://localhost:9090](http://localhost:9090) | Scrapes backend `/metrics` every 5 seconds | Direct Access |
| **Grafana Dashboard** | [http://localhost:3000](http://localhost:3000) | Pre-provisioned KatherBox Observability Dashboard | `admin` / `admin` |
| **Redis Cache** | `localhost:6380` (Internal `6379`) | In-memory read-through cache & prefix invalidation | Passwordless local |
| **Readiness Probe** | [http://localhost:8081/health/ready](http://localhost:8081/health/ready) | Deep system health (DB, Redis, Memory, Goroutines, Circuit Breakers) | Public API |

---

## 🔐 Demo Accounts

| Role | Email | Password | Pre-loaded Features |
| :--- | :--- | :--- | :--- |
| **Super Admin** | `admin@katherbox.com` | `Admin@12345` | Complete `/admin` back-office, catalog management, order approvals, analytics |
| **Staff Member** | `staff@katherbox.com` | `Staff@12345` | Fulfilment dashboard (Orders & Returns management) |
| **Customer** | `customer@test.com` | `Customer@12345` | Seeded with 32 orders, subscriptions, wishlist, reviews, care journal, Gold loyalty |
| **Customer (Alt)** | `iftakhar@gmail.com` | `Customer@12345` | Pre-configured customer profile |

*(You can also register new customer accounts directly on the storefront).*

---

## 🛠️ Complete Feature & Technical Update Log (Phases 1 – 6)

Every component below was engineered, tested, and verified:

### 1. 🛡️ Phase 1: Resilience & Observability
- **Request ID Propagation**: Generates or forwards a unique `X-Request-ID` across every incoming HTTP request for distributed tracing.
- **Structured JSON Logging**: Custom high-speed logger capturing request duration, HTTP method, path, client IP, user agent, and status code formatted for ELK/Loki ingestion.
- **Token-Bucket Rate Limiter**: Thread-safe in-memory rate limiter allocating 120 requests/minute per IP with burst capacity. Bursts exceeding limits return `HTTP 429 Too Many Requests` with dynamic `Retry-After` headers.
- **Circuit Breaker Pattern**: Three-state state machine (`Closed`, `Open`, `Half-Open`) protecting external dependencies (payment gateways, AI APIs) with fallback execution and automated health recovery.
- **Comprehensive Health Probes**:
  - `/health` / `/api/health`: General uptime and version check.
  - `/health/live`: Kubernetes / Docker liveness probe.
  - `/health/ready`: Deep readiness probe inspecting database connection pools, memory allocations (`alloc_mb`, `sys_mb`), active goroutines, GC cycles, and circuit breaker status.

### 2. 📊 Phase 2: Prometheus Metrics & Grafana Dashboard
- **Standard Prometheus Instrumentation**: Integrated `github.com/prometheus/client_golang` exposing `/metrics` with:
  - `http_requests_total` (labeled by method, handler, status code).
  - `http_request_duration_seconds` (histogram with p50, p90, p99 percentiles).
  - `http_requests_in_flight` (gauge tracking concurrent requests).
- **Auto-Provisioned Prometheus**: Pre-configured `monitoring/prometheus/prometheus.yml` actively scraping `backend:8081/metrics` every 5 seconds.
- **Auto-Provisioned Grafana**: Containerized Grafana instance with pre-loaded Prometheus datasource and a custom `KatherBox System Dashboard` (`monitoring/grafana/provisioning/dashboards/katherbox_dashboard.json`) charting throughput, latencies, and error rates.

### 3. ⚡ Phase 3: High Concurrency, Inventory Locking & Payment Idempotency
- **Atomic Stock Reservation**: Eliminated inventory overselling and race conditions by enforcing conditional SQL updates (`UPDATE products SET stock = stock - ? WHERE id = ? AND stock >= ?`) and verifying affected row counts inside transactional blocks.
- **Idempotent Request Handling**: Custom `Idempotency-Key` header middleware backed by `IdempotencyRecord` database table:
  - Duplicate requests replay cached responses with `X-Cache-Lookup: HIT`.
  - Concurrent in-flight duplicate requests are blocked with `HTTP 409 Conflict`.
- **Cryptographic Payment Gateway Flow**:
  - Payment session initiation via `/api/payments/initiate`.
  - Cryptographic HMAC-SHA256 signature generation and callback verification via `/api/payments/callback`.
  - Automated transition of order status to `Processing` and payment status to `Paid`.

### 4. 🩺 Phase 4: AI/LLM Plant Doctor (Dual-Mode Architecture)
- **Dual-Mode Intelligence**:
  - **Online Cloud Mode**: Connects to Google Gemini 1.5 Flash API when `GEMINI_API_KEY` is present.
  - **Offline Local Heuristic Mode**: Automated fallback to a pure-Go botanical expert knowledge base capable of diagnosing Chlorosis, Septoria Leaf Spot, Overwatering, Nitrogen deficiency, and Spider mites.
- **Interactive Global Modal**: Global Floating Action Button (`🩺🌿 AI Plant Doctor`) accessible across the entire customer application with:
  - Quick-select symptom chips (e.g. Yellow Leaves, Brown Spots, Drooping, White Pests).
  - Diagnostic report with confidence score, severity rating, and step-by-step action plans.
  - Conversational Q&A chat for real-time plant care inquiries.

### 5. 🔬 Phase 5: ML Model Comparison & Interactive Algorithm Studio
- **Machine Learning Model Comparison Harness**:
  - Compares lightweight edge vision model (`MobilePlantNet-v3`, Quantized INT8, ~4ms) vs cloud deep learning model (`DeepBotanist-ResNet50`, FP32, ~30ms).
  - Measures latency speedup, inference throughput (IPS), memory footprint, confidence scores, and outputs production deployment recommendations.
  - Exposes `/api/ml/compare` endpoint.
- **Interactive Algorithm Studio (`/algorithms`)**:
  - **Dijkstra Delivery Routing Visualizer**: Graph animation finding the shortest path across 7 major Dhaka delivery hubs (Mirpur, Uttara, Dhanmondi, Gulshan, Motijheel, Old Dhaka, Farmgate) with distance telemetry.
  - **First-Fit Decreasing Box Packing Visualizer**: Solves the 1D/2D bin packing problem, animating how plant pots of varying dimensions are packed into standard wooden nursery shipping crates.
  - **Live Benchmark Telemetry**: Side-by-side comparative cards with live execution timers.

### 6. 🗄️ Phase 6: Multi-Database Support (Redis Caching & PostgreSQL)
- **Redis Read-Through Caching Layer**:
  - Transparently caches product searches/pagination (`/api/products`) and category listings (`/api/categories`) with `X-Cache: HIT` and `X-Cache: MISS` telemetry.
  - Automated prefix-based cache invalidation (`products:*`, `categories:*`) triggered whenever an admin creates, updates, or deletes a product or category.
  - Graceful degradation: If Redis is offline or disabled, backend seamlessly falls back to direct database queries without request failure.
- **Multi-Driver Database Architecture**:
  - Configurable via `DB_DRIVER` in `backend/database/database.go`.
  - Defaults to zero-dependency pure-Go SQLite for instant local development.
  - Supports PostgreSQL via `DB_DRIVER=postgres` with production connection pooling (`SetMaxOpenConns(25)`, `SetMaxIdleConns(10)`).
  - PostgreSQL container service ready in `docker-compose.yml` under `--profile postgres`.
- **Frontend Authentication Resilience**:
  - Added Axios 401 response interceptor with reactive `auth:logout` event dispatching.
  - Re-validates tokens against `/api/auth/me` on application mount to prevent stale/invalid `localStorage` sessions.
  - Added explicit Sign-In recovery buttons to cart and error views.

---

## 🧪 Automated Testing & Verification

### 1. Go Unit Test Suite
To run all backend unit tests:

```bash
cd backend
go test -v ./...
```

**Results:**
```
=== RUN   TestCompareModelsEndpoint
--- PASS: TestCompareModelsEndpoint (0.00s)
=== RUN   TestRedisGracefulDegradationWhenNil
--- PASS: TestRedisGracefulDegradationWhenNil (0.00s)
=== RUN   TestPrometheusMetricsExposition
--- PASS: TestPrometheusMetricsExposition (0.00s)
=== RUN   TestTokenBucketLimiterAllow
--- PASS: TestTokenBucketLimiterAllow (1.10s)
=== RUN   TestRateLimiterMiddlewareHTTP
--- PASS: TestRateLimiterMiddlewareHTTP (0.00s)
=== RUN   TestRequestIDMiddlewareGenerated
--- PASS: TestRequestIDMiddlewareGenerated (0.00s)
=== RUN   TestRequestIDMiddlewarePropagated
--- PASS: TestRequestIDMiddlewarePropagated (0.00s)
=== RUN   TestLocalBotanicalExpertDiagnosisYellowLeaves
--- PASS: TestLocalBotanicalExpertDiagnosisYellowLeaves (0.00s)
=== RUN   TestLocalBotanicalExpertDiagnosisPests
--- PASS: TestLocalBotanicalExpertDiagnosisPests (0.00s)
=== RUN   TestLocalBotanicalExpertChat
--- PASS: TestLocalBotanicalExpertChat (0.00s)
=== RUN   TestCircuitBreakerStateTransitions
--- PASS: TestCircuitBreakerStateTransitions (0.06s)
=== RUN   TestCircuitBreakerFallback
--- PASS: TestCircuitBreakerFallback (0.00s)
PASS
```

### 2. Full End-to-End Regression Test Suite (40/40 Passing)
Runs complete end-to-end integration tests covering customer journeys, authentication, payments, stock reservation, AI diagnostics, ML benchmarks, Redis caching, and database health:

```bash
python3 scratch/e2e_test.py
```

**Output:**
```
Starting E2E test suite...
[✓] Health / Get Products
[✓] Login Admin
[✓] Login Staff
[✓] Register User
[✓] User Me
[✓] Update Profile
[✓] Addresses CRUD
[✓] Cart Operations & Stock Reservation
[✓] Coupon Validate & Apply
[✓] Checkout Order
[✓] Stock Retention After Checkout
[✓] Get Orders & Detail
[✓] Order Invoice & Receipt
[✓] Wishlist CRUD
[✓] Reviews CRUD
[✓] Consultations Booking
[✓] Subscriptions Booking
[✓] Growth Journal CRUD
[✓] Community Posts (Public & Auth)
[✓] Admin Cancel Order & Stock Restoration
[✓] Admin Analytics
[✓] Admin Users List
[✓] Admin Product CRUD (Unique Slug & Deduplication)
[✓] Admin Confirm Consultation
[✓] Categories API
[✓] Blog API & Article Detail
[✓] Security Boundary (Admin Protection)
[✓] Frontend SPA Routing & Fallback
[✓] SQLite Database PRAGMA Integrity Check
[✓] Prometheus Metrics Exposition
[✓] Enhanced Health Readiness Probe
[✓] Idempotency Key Replay Verification
[✓] Payment Session & HMAC Signature Callback
[✓] AI Plant Doctor Symptom Diagnosis
[✓] AI Plant Doctor Conversational Q&A
[✓] ML Model Comparison Benchmark
[✓] Algorithm Studio Visualizer Route
[✓] Redis Read-Through Caching & Cache-HIT
[✓] Redis Cache Invalidation on Admin Mutation
[✓] Multi-Database Health & Readiness Probe

Summary: 40 tests run, 40 passed, 0 failed.
```

---

## 🗺️ Application Routes

| Path | Description | Access |
| :--- | :--- | :--- |
| `/` | Storefront, hero banner, category filters, featured plants | Public |
| `/shop` | Full catalog with advanced filters (sunlight, water, pet-friendly) | Public |
| `/algorithms` | **Algorithm Studio** (Dijkstra routing, Box Packing, ML benchmark) | Public / Customer |
| `/cart` | Shopping cart, Green Points redemption, coupon application, gift wrap | Customer |
| `/orders` | Order history, invoice download, live status tracking | Customer |
| `/admin` | Back-office dashboard, inventory, orders, CMS, analytics, DB backup | Admin / Staff |
| `/community` | Plant parent community, Q&A, photo showcases | Customer |
| `/care` | Plant care schedules, watering reminders, growth journal | Customer |
| `/subscriptions` | Weekly, monthly, and quarterly botanical box subscriptions | Customer |
| `/consultations` | Book 1-on-1 virtual or on-site plant doctor consultations | Customer |
| `/corporate` | Bulk corporate plant gifting and office greening quotes | Customer / Corporate |

---

## 🏗️ Project Architecture & Layout

```
kather_baksho/
├── backend/                        # Go 1.25 REST API
│   ├── controllers/                # Handlers (Cart, Products, Orders, AI, ML, Health)
│   ├── routes/                     # Gin route groups
│   ├── middleware/                 # RateLimiter, StructuredLogger, Metrics, Idempotency, Auth
│   ├── database/                   # GORM connection (SQLite/PostgreSQL) & Redis cache client
│   ├── services/                   # AI Plant Doctor (Gemini + Local heuristic fallback)
│   ├── utils/                      # Circuit breaker, JWT, Password hashing
│   ├── cmd/                        # Database seeders & admin user CLI tools
│   ├── main.go                     # Entrypoint & middleware chaining
│   └── Dockerfile                  # Multi-stage Alpine container build
├── frontend/                       # React 18 + Vite SPA
│   ├── src/
│   │   ├── api/                    # Axios API clients with 401 interceptors
│   │   ├── components/             # Reusable UI widgets & AIPlantDoctorModal
│   │   ├── context/                # AuthContext & CartContext
│   │   ├── pages/                  # Storefront, Admin, Cart, AlgorithmVisualizer
│   │   └── App.jsx                 # Routing, layout shell & global FAB triggers
│   ├── nginx.conf                  # Production SPA reverse proxy
│   └── Dockerfile                  # Multi-stage Nginx container build
├── monitoring/
│   ├── prometheus/prometheus.yml   # Prometheus scrape configuration
│   └── grafana/provisioning/       # Pre-configured Grafana datasource & dashboard
├── docker-compose.yml              # Multi-container orchestration (App + Redis + Observability)
└── README.md                       # ← Main documentation
```

---

## 📄 License
This project is licensed under the MIT License. Crafted with love for plant lovers in Bangladesh.
