# 🌿 Kather Baksho (কাঠের বাক্স)
### High-Performance, Resilient Full-Stack E-Commerce & Botanical Platform

> **100% Local Enterprise Architecture** built with **Go (Gin + GORM)**, **React 18 (Vite + React Router v7)**, **Node.js & TypeScript Microservices**, **Polyglot Persistence (SQLite, Redis, MongoDB 7.0)**, **Traefik v3.1 Cloud-Native API Gateway**, **Real-Time Goroutine WebSockets**, **Prometheus & Grafana Observability**, **Atomic Concurrency Control**, **Payment Idempotency**, **OpenAPI 3.0 / Swagger UI**, **AI Plant Doctor**, **Algorithm Visualizers**, and **AWS EC2 Infrastructure-as-Code (Terraform)**.

[![Backend Tests](https://img.shields.io/badge/Go%20Unit%20Tests-Passing-brightgreen)](https://github.com/iftakhar-323/kather_baksho)
[![E2E Tests](https://img.shields.io/badge/E2E%20Regression-60%2F60%20Passing-success)](https://github.com/iftakhar-323/kather_baksho)
[![Docker Compose](https://img.shields.io/badge/Docker%20Compose-9%20Services%20Active-blue)](https://github.com/iftakhar-323/kather_baksho)
[![OpenAPI](https://img.shields.io/badge/OpenAPI-3.0.3-teal)](http://localhost:8085/docs)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue)](https://github.com/iftakhar-323/kather_baksho)

---

## 🚀 1-Command Quickstart (100% Localhost)

Run the complete multi-service stack (Frontend, Backend, TypeScript Worker, MongoDB, Redis, MinIO, Traefik, Prometheus, Grafana) with one command:

```bash
git clone https://github.com/iftakhar-323/kather_baksho.git
cd kather_baksho
docker compose up -d --build
```

*(Or run `./run.sh`)*

### 🌐 Local Service Map & Credentials

| Service | Local URL | Description | Default Credentials |
| :--- | :--- | :--- | :--- |
| **Traefik Cloud-Native Ingress Gateway** | [http://localhost:8085](http://localhost:8085) | Primary unified edge proxy routing frontend, API, worker & WebSockets | Direct Access |
| **Traefik Live Dashboard** | [http://localhost:8086/dashboard/](http://localhost:8086/dashboard/) | Real-time reverse proxy telemetry, router health, and active middlewares | Direct Access |
| **Interactive Swagger / OpenAPI UI** | [http://localhost:8085/docs](http://localhost:8085/docs) | Interactive OpenAPI 3.0 API explorer with parameter schemas and JWT auth | Direct Access |
| **Frontend Web App** | [http://localhost:8082](http://localhost:8082) | Storefront, Customer Portal, Admin Panel, IoT Plant Care, AI Doctor & Algorithm Studio | Public / Demo User |
| **Backend REST API** | [http://localhost:8081](http://localhost:8081) | High-throughput Go REST API with CORS, Metrics, Mongo & Redis Caching | `admin@kather_baksho.com` / `Admin@12345` |
| **Real-Time WebSocket Courier Radar** | `ws://localhost:8085/ws/orders/:id/track` | Goroutine WebSocket streaming live courier GPS coordinates across Dhaka | Direct Stream |
| **Node.js & TypeScript Worker** | [http://localhost:8083](http://localhost:8083) | Microservice for enterprise vector PDF invoices and analytics reports | Inter-service / Direct |
| **MinIO S3 Object Storage API** | [http://localhost:9005](http://localhost:9005) | Local AWS S3-compatible media datastore & asset pipeline | `kather_baksho_admin` / `kather_baksho_s3_secret` |
| **MinIO S3 Web Console** | [http://localhost:9006](http://localhost:9006) | Web visual browser for buckets, media assets, and storage policies | `kather_baksho_admin` / `kather_baksho_s3_secret` |
| **MongoDB 7.0 IoT Datastore** | `localhost:27019` (Internal `27017`) | Polyglot document & time-series database storing botanical sensor telemetry | Direct Access |
| **Redis Cache & Streams Bus** | `localhost:6380` (Internal `6379`) | In-memory read-through cache & Redis Streams event message queue | Passwordless local |
| **Prometheus Telemetry** | [http://localhost:9090](http://localhost:9090) | Scrapes backend `/metrics` every 5 seconds | Direct Access |
| **Grafana Dashboard** | [http://localhost:3000](http://localhost:3000) | Pre-provisioned Kather_Baksho Observability Dashboard | `admin` / `admin` |
| **Tri-Database Readiness Probe** | [http://localhost:8081/health/ready](http://localhost:8081/health/ready) | Deep health probe validating SQLite WAL, Redis PONG, and MongoDB 7.0 ping | Public API |

---

## 🔐 Demo Accounts

| Role | Email | Password | Pre-loaded Features |
| :--- | :--- | :--- | :--- |
| **Super Admin** | `admin@kather_baksho.com` | `Admin@12345` | Complete `/admin` back-office, catalog management, order approvals, analytics |
| **Staff Member** | `staff@kather_baksho.com` | `Staff@12345` | Fulfilment dashboard (Orders & Returns management) |
| **Customer** | `customer@test.com` | `Customer@12345` | Seeded with orders, subscriptions, wishlist, reviews, care journal, Gold loyalty |
| **Customer (Alt)** | `iftakhar@gmail.com` | `Customer@12345` | Pre-configured customer profile |

---

## 🛠️ Complete Architectural Engineering Implementation

Every component below was engineered, tested, and verified:

### 1. 🛡️ Resilience, Circuit Breakers & Distributed Tracing
- **Request ID Propagation**: Generates or forwards a unique `X-Request-ID` across every incoming HTTP request for distributed tracing.
- **Structured JSON Logging**: High-speed logger capturing request duration, HTTP method, path, client IP, user agent, and status code formatted for ELK/Loki ingestion.
- **Token-Bucket Rate Limiter**: Thread-safe in-memory rate limiter allocating 120 requests/minute per IP with burst capacity. Bursts exceeding limits return `HTTP 429 Too Many Requests` with dynamic `Retry-After` headers.
- **Circuit Breaker Pattern**: Three-state state machine (`Closed`, `Open`, `Half-Open`) protecting external dependencies with fallback execution and automated health recovery.
- **Tri-Database Readiness Probe (`/health/ready`)**: Validates SQLite WAL, Redis cache ping, and MongoDB 7.0 ping concurrently alongside memory allocations (`alloc_mb`, `sys_mb`), active goroutines, and GC stats.

### 2. 📊 Prometheus Metrics & Grafana Observability
- **Prometheus Exporter (`/metrics`)**: Standard Prometheus metrics exposing request counts, latencies (p50, p90, p99), error rates, and concurrent in-flight requests.
- **Auto-Provisioned Grafana**: Containerized Grafana instance with pre-loaded Prometheus datasource and a custom `Kather_Baksho System Dashboard` charting throughput, latencies, and error rates.

### 3. ⚡ High Concurrency, Inventory Locking & Payment Idempotency
- **Atomic Stock Reservation**: Eliminated inventory overselling by enforcing conditional SQL updates (`UPDATE products SET stock = stock - ? WHERE id = ? AND stock >= ?`) and verifying affected row counts inside transactional blocks.
- **Idempotent Request Handling**: Custom `Idempotency-Key` header middleware backed by `IdempotencyRecord` database table with replay caching and conflict resolution.
- **Cryptographic Payment Gateway**: Mock payment session initiation and HMAC-SHA256 signature verification with automated order status transitions.

### 4. 🩺 Dual-Mode AI Plant Doctor & Algorithm Studio
- **Dual-Mode Intelligence**: Connects to Google Gemini 1.5 Flash when `GEMINI_API_KEY` is present, with an automated fallback to a local botanical expert heuristic engine.
- **Algorithm Studio (`/algorithms`)**:
  - **Dijkstra Delivery Routing Visualizer**: Graph animation finding the shortest path across 7 major Dhaka delivery hubs with real-time distance calculations.
  - **First-Fit Decreasing Box Packing Visualizer**: Solves the bin packing problem, animating how plant pots of varying dimensions are packed into standard nursery wooden shipping crates.
  - **ML Model Comparison Benchmark**: Benchmarks `MobilePlantNet-v3` vs `DeepBotanist-ResNet50`.

### 5. 🚀 Node.js & TypeScript Worker Microservice
- **Dedicated Containerized Worker**: Running on port `8083` (`kather_baksho-worker-ts`) built with Express, TypeScript 5.5, and PDFKit.
- **Vector PDF Generation Engine**:
  - `POST /api/v1/invoices/generate`: Generates high-resolution vector PDF invoices with typography and botanical branding.
  - `POST /api/v1/reports/sales-pdf`: Generates executive sales and analytics reports with KPI cards.
- **Go Backend Microservice Bridge**: `GET /api/orders/:id/invoice/pdf` and `GET /api/analytics/report/pdf` proxying requests directly to the worker.

### 6. 🌱 MongoDB Polyglot Persistence & IoT Botanical Telemetry
- **MongoDB 7.0 Datastore**: Running on port `27019` (`kather_baksho-mongo`) storing time-series plant telemetry data.
- **Botanical Sensor Telemetry Engine**:
  - Ingests soil moisture, ambient temperature, humidity, sunlight lux, and pH levels.
  - Automatically assesses botanical status: `Optimal Health`, `Needs Water` (moisture < 25%), `High Heat Caution` (temp > 35°C), `Low Light` (lux < 200).
- **Interactive UI Monitor**: Embedded in `/care` with real-time gauges, status badges, and sample telemetry simulators.

### 7. 🔀 Traefik v3.1 Cloud-Native Reverse Proxy & API Gateway
- **Unified Ingress Edge**: Exposes port `8085` as the primary application entrypoint.
- **Dynamic Routing**:
  - `/` → Frontend React SPA
  - `/api`, `/health`, `/metrics`, `/ws`, `/docs`, `/swagger` → Go Backend
  - `/worker` → Node.js TypeScript Worker
- **Traefik Live Dashboard**: Accessible on port `8086/dashboard/` showing router metrics and service health.

### 8. 🛵 Real-Time Goroutine WebSockets & Delivery Rider Radar
- **WebSocket Gateway (`/ws/orders/:id/track`)**: Pure-Go goroutine streaming real-time courier GPS coordinates across Dhaka milestones (Mirpur Hub → Mirpur 10 → Agargaon → Bijoy Sarani → Local Area → Doorstep).
- **Live Delivery Radar UI**: Embedded in customer order details with live pulse indicator, dynamic Dijkstra ETA countdown, speed speedometer, and milestone checkpoints.

### 9. 📖 Interactive Swagger / OpenAPI 3.0 Documentation & TypeScript Types
- **Interactive Swagger UI**: Accessible at `http://localhost:8085/docs` and `http://localhost:8081/docs`.
- **OpenAPI 3.0 JSON Specification**: Available at `/api/docs/openapi.json`.
- **Frontend TypeScript Architecture**: Added `tsconfig.json` and strict type definitions in `frontend/src/types/` (`product.d.ts`, `order.d.ts`, `user.d.ts`, `telemetry.d.ts`, `index.d.ts`).

### 10. ☁️ AWS EC2 Infrastructure-as-Code & Production Automation
- **Terraform IaC (`infra/terraform/`)**: Fully provisioned AWS VPC, Public Subnet, Internet Gateway, Security Groups (Ports 22, 80, 443, 8085, 8086, 3000), Ubuntu 24.04 EC2 instance, and Elastic IP.
- **Production User Data**: Automates Docker, Docker Compose, sysctl memory configuration, and firewall rules on boot.
- **Deployment Script (`deploy/ec2-setup.sh`)**: 1-click bash automation script creating a production systemd service (`kather_baksho.service`) for automatic container startup on server reboot.

### 11. 📨 Event-Driven Architecture & Message Bus (Redis Streams + DLQ)
- **Redis Streams Message Bus (`kb:events:stream`)**: Decentralized event publishing (`XADD`) with consumer groups (`kb_workers`) and parallel background worker daemons.
- **Automatic Retries & Dead-Letter Queue (DLQ)**: Retries transient processing errors up to 3 times before routing unrecoverable payloads into `kb:events:dlq` with detailed failure diagnostics.
- **Asynchronous Domain Events**: Automatically emits `order.created`, `inventory.low`, and `payment.processed` domain events decoupled from HTTP handlers.
- **Telemetry & Monitoring**: Live stream and DLQ inspection via `GET /api/events/stats`.

### 12. 🔍 SQLite FTS5 Full-Text Search Engine & Typo-Tolerant Snippets
- **Zero-Dependency Search Engine**: Uses SQLite FTS5 virtual tables (`products_fts`) with Porter stemming and tokenization.
- **Dynamic Content Highlighting**: Automatically generates highlighted `<mark>` snippet tags around matching terms in product names and descriptions.
- **Typo-Tolerant Prefix Matching**: Seamlessly matches partial terms (e.g. `succ` → `Succulent`, `monst` → `Monstera Deliciosa`).
- **Interactive Global Search UI**: Unified auto-completing search modal accessible across all storefront pages.

### 13. 🗄️ Local MinIO S3-Compatible Object Storage & Media Pipeline
- **Local S3 Object Datastore**: Containerized MinIO instance (`kather_baksho-minio`) exposing standard AWS S3 APIs on port `9005` and a visual Web Management Console on port `9006`.
- **Media Upload Pipeline**: Secure multipart media uploads (`POST /api/media/upload`) with SHA256 deduplication, automatic bucket auto-provisioning (`kather-baksho-media`), and in-memory fallback cache.
- **Direct S3 Retrieval**: Public binary image streaming via `GET /api/media/file/:filename`.

### 14. 🔑 Enterprise RFC 6238 TOTP Two-Factor Authentication
- **Pure Go TOTP Implementation**: Zero external dependencies, fully conforming to RFC 6238 and RFC 4226. Compatible with Google Authenticator, Authy, and 1Password.
- **Step-Up Login Challenge**: Login returns a short-lived `temp_token` (`role: 2fa_pending`) requiring OTP code verification before issuing a full-access JWT.
- **Time-Drift Resilience**: Window skew tolerance (±30s) compensating for user mobile clock drift.
- **One-Time Emergency Recovery Codes**: Issues 8 cryptographically secure human-friendly recovery codes (`XXXX-XXXX`) for account recovery if the authenticator device is lost.

### 15. 💥 Chaos Engineering & Interactive Resilience Studio
- **Configurable Fault Injection Middleware**: Real-time thread-safe fault injection simulating network latency (0-2000ms), error rates (0-50% HTTP 503), and targeted endpoint blast radiuses.
- **Interactive Resilience Visualizer**: Dedicated studio inside `/algorithms` with live fault sliders, total request telemetry, delayed request counters, and manual circuit breaker tripping.
- **Circuit Breaker Health Monitor**: Real-time visual status cards showing `CLOSED` (Healthy), `OPEN` (Tripped), and `HALF-OPEN` states with 1-click emergency baseline restoration (`POST /api/chaos/reset`).

### 16. ⚡ Automated Concurrency & Stress Testing Benchmark (Flash Sale Simulator)
- **Flash Sale Concurrency Simulator (`tests/stress_test.py`)**: Multi-threaded race condition engine testing concurrent checkouts competing for limited stock.
- **ACID Inventory Guarantee**: Enforces conditional atomic SQL decrements (`WHERE id = ? AND stock >= ?`) guaranteeing zero overselling under heavy concurrency.
- **Statistical Performance Dashboard**: Computes requests/sec (RPS) and latency distributions (min, p50, p95, p99, max).

---

## 🧪 Automated Testing & Verification

### 1. Go Unit Test Suite
To run all backend unit tests:

```bash
cd backend
go test -v ./...
```

### 2. Full End-to-End Regression Suite (60 Tests)
To run the automated integration test suite across all 9 microservices, storage engines, and databases:

```bash
python3 tests/e2e_test.py
```

### 3. Concurrency & Flash Sale Stress Benchmark
To run high-concurrency race condition simulations:

```bash
python3 tests/stress_test.py --concurrency 50 --stock 5
```

**Results (100% Passing - 60/60 Tests):**
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
[✓] Node.js & TypeScript Worker Health Probe
[✓] Node.js & TypeScript Direct PDF Generation
[✓] Go Backend PDF Invoice Proxy
[✓] Go Backend Analytics Executive Report PDF
[✓] MongoDB Tri-Database Readiness Probe
[✓] MongoDB IoT Telemetry Ingestion & Alerting
[✓] MongoDB Monitored Plants Snapshot
[✓] MongoDB IoT Telemetry Time-Series History
[✓] Traefik Ingress Routing (Frontend, API & Worker)
[✓] Traefik Live Dashboard & Telemetry API
[✓] WebSocket Real-Time Order & Rider Tracking
[✓] OpenAPI 3.0 Specification & Interactive Swagger UI
[✓] Frontend TypeScript Type Declarations & Config
[✓] AWS EC2 Infrastructure-as-Code & Deployment Orchestration
[✓] Redis Streams Event-Driven Architecture & Message Bus
[✓] SQLite Full-Text Search (FTS) & Highlight Snippets
[✓] Local MinIO S3 Object Storage & Media Pipeline
[✓] Enterprise RFC 6238 TOTP Two-Factor Authentication
[✓] Chaos Engineering & Resilience Studio (Fault Injection & Circuit Breakers)
[✓] Automated Concurrency & Stress Testing Benchmark (Flash Sale Simulator)

Summary: 60 tests run, 60 passed, 0 failed.
```

---

## 🏗️ Project Architecture & Layout

```
kather_baksho/
├── backend/                        # Go 1.22+ REST & WebSocket API
│   ├── controllers/                # Handlers (Cart, Products, Orders, AI, ML, IoT, WS, Docs)
│   ├── routes/                     # Gin route groups
│   ├── middleware/                 # RateLimiter, StructuredLogger, Metrics, Idempotency, Auth
│   ├── database/                   # SQLite/Postgres GORM, Redis client, MongoDB driver
│   ├── models/                     # GORM entities & MongoDB telemetry BSON models
│   ├── services/                   # AI Plant Doctor (Gemini + Local heuristic fallback)
│   ├── utils/                      # Circuit breaker, JWT, Password hashing
│   ├── cmd/                        # Database seeders & admin user CLI tools
│   ├── main.go                     # Entrypoint & middleware chaining
│   └── Dockerfile                  # Multi-stage Alpine container build
├── frontend/                       # React 18 + Vite SPA + TypeScript Definitions
│   ├── src/
│   │   ├── api/                    # Axios API clients with 401 interceptors
│   │   ├── components/             # SmartGardenMonitor, LiveDeliveryRadar, AIPlantDoctorModal
│   │   ├── context/                # AuthContext & CartContext
│   │   ├── pages/                  # Storefront, Admin, Cart, Care, AlgorithmVisualizer
│   │   ├── types/                  # Strict TypeScript declarations (product, order, user, telemetry)
│   │   └── App.jsx                 # Routing, layout shell & global triggers
│   ├── tsconfig.json               # TypeScript compiler options
│   ├── nginx.conf                  # Production SPA reverse proxy
│   └── Dockerfile                  # Multi-stage Nginx container build
├── services/
│   └── worker-ts/                  # Node.js & TypeScript Microservice (Port 8083)
│       ├── src/                    # Express routes & PDFKit vector document renderers
│       ├── tsconfig.json           # Strict TypeScript configuration
│       └── Dockerfile              # Multi-stage Alpine container build
├── monitoring/
│   ├── traefik/                    # Traefik v3.1 static & dynamic routing rules
│   ├── prometheus/prometheus.yml   # Prometheus scrape configuration
│   └── grafana/provisioning/       # Pre-configured Grafana datasource & dashboard
├── infra/
│   └── terraform/                  # AWS EC2, VPC, Subnet, Security Groups & User Data IaC
├── deploy/
│   └── ec2-setup.sh                # 1-Click production Ubuntu / EC2 deploy automation
├── tests/
│   └── e2e_test.py                 # Comprehensive 54-test automated E2E test suite
├── docker-compose.yml              # 8-Container orchestration stack
├── run.sh                          # Local developer quickstart script
└── README.md                       # ← Main documentation
```

---

## 📄 License
This project is licensed under the MIT License. Crafted with love for plant lovers in Bangladesh.
