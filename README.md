# MyStackOverflow

A modern, distributed Q&A platform inspired by Stack Overflow, built to explore cloud-native architecture and microservices.

## Overview
MyStackOverflow is a comprehensive learning ground for distributed systems. The application allows users to ask questions, post answers, and manage their profiles, all while being powered by a robust, decoupled backend system orchestrated by **.NET Aspire**.

## Why I Built This
The goal of this project was to move away from a traditional monolithic architecture and implement independent microservices that handle specific domains (like Identity, Q&A functionality, and Search), seamlessly tied together with a modern Next.js user interface.

## Tech Stack & Architecture

### Frontend
* **Framework:** Next.js 16 / React 19 (App Router, Server Actions)
* **Styling:** Tailwind CSS with HeroUI v3 components
* **Data Fetching:** Server-Side Rendering (SSR) and Client-Side fetching

### Backend (Microservices)
* **Framework:** .NET Core Web API (C#)
* **Architecture:** Distributed Microservices
* **QuestionService:** questions, answers and tags (EF Core + PostgreSQL)
* **SearchService:** full-text search, kept up to date by consuming events
* **ProfileService:** display name, avatar and reputation per user
* **VoteService:** one vote per user per target, final once cast (EF Core + PostgreSQL)
* **StatsService:** trending tags and top users, event sourced with Marten
* **Gateway:** YARP reverse proxy — the single entry point the frontend talks to
* **Identity Provider:** Keycloak (OAuth2 / OpenID Connect for secure user authentication)

### Infrastructure & Data
* **Orchestration:** .NET Aspire (simplifies running distributed apps locally)
* **Containerization:** Docker (used to run Keycloak, databases, and message brokers)
* **Database:** PostgreSQL
* **Search Engine:** Typesense
* **Message Broker:** RabbitMQ, via Wolverine (facilitates event-driven communication between APIs)
* **Media:** Cloudinary for uploaded images and avatars
* **Caching:** in-memory on the API side (tag lookups, 2-hour expiry) and tagged fetch
  caching in Next.js, invalidated on write so an edit is visible immediately

## Key Features
* **Secure Authentication:** Full user login and registration flow managed by Keycloak.
* **Ask and Answer:** Rich text questions with image upload, editing, and accepted answers.
* **Full-Text Search:** Typesense index kept current by events, with tag filtering.
* **User Profiles:** Display name, avatar and reputation, resolved in one batched lookup per page.
* **Microservices Architecture:** Independent backend services that communicate securely and asynchronously.
* **Responsive UI:** A fast, SEO-friendly, and modern user interface built with Next.js.
* **Cloud-Native Ready:** Designed with containers and .NET Aspire to be easily deployable to cloud environments.

## How to Run It

### Prerequisites

* **Docker Desktop**, running — every dependency is a container
* **.NET 10 SDK** and the **Aspire CLI** (`dotnet tool install -g aspire.cli`)
* **Node.js 20+** for the Next.js web app

### 1. Create `webapp/.env.local`

Not in version control, so a fresh clone has to supply it. The Keycloak client ids match
the ones seeded in `infra/realms/MyStackOverflow-realm.json`; the secrets come from that
realm's client credentials, and the Cloudinary values from your own account:

```ini
API_URL=http://localhost:8001
AUTH_KEYCLOACK_ID=Next JS Client
AUTH_KEYCLOACK_SECRET=<client secret from Keycloak>
AUTH_KEYCLOACK_ISSUER=http://localhost:6001/realms/MyStackOverflow
AUTH_URL=http://localhost:3000
AUTH_SECRET=<any random string; `openssl rand -base64 32`>

# Service account used server-side for the in-app registration form,
# which calls Keycloak's Admin REST API. Not used for user login.
AUTH_KEYCLOACK_ADMIN_CLIENT_ID=webapp-admin
AUTH_KEYCLOACK_ADMIN_CLIENT_SECRET=<client secret from Keycloak>

CLOUDINARY_CLOUD_NAME=<your cloud name>
CLOUDINARY_API_KEY=<your api key>
CLOUDINARY_API_SECRET=<your api secret>
```

### 2. Start the stack

Aspire brings up everything — the services, PostgreSQL, Keycloak, RabbitMQ and
Typesense — in one go:

```powershell
$env:ASPIRE_ALLOW_UNSECURED_TRANSPORT="true"
aspire run
```

That variable is required: the AppHost ships only an `http` launch profile, and Aspire
refuses a non-https `applicationUrl` without it. Running the AppHost from an IDE sets it
for you.

| Service | URL |
|---|---|
| Web app | `http://localhost:3000` |
| Gateway (API) | `http://localhost:8001` |
| Aspire dashboard | `http://localhost:5001` |
| Keycloak | `http://localhost:6001` |

Container ports for PostgreSQL and Keycloak's admin console are reassigned on every
restart — read them from the dashboard rather than assuming.

The realm import seeds users you can sign in with right away: `kikofranco`, `bob`,
`dave` and `admin`.

### Running the deployed (production) stack

`aspire deploy` generates a Compose project and runs it behind nginx-proxy with TLS,
which is a different stack from `aspire run` — its own volumes, its own Keycloak realm
data, and its own copy of whatever the code looked like at deploy time.

It serves the app over the hostnames in `infra/certs`, so those have to resolve locally.
Add to your hosts file (`C:\Windows\System32\drivers\etc\hosts`, as administrator):

```
127.0.0.1 app.mystackoverflow.local api.mystackoverflow.local id.mystackoverflow.local
```

Then:

```powershell
aspire deploy
```

The app is at `https://app.mystackoverflow.local` and the dashboard at
`http://localhost:8080`. The certificates are self-signed, so the browser will warn on
first visit.

Two things to know before deploying:

* **It prompts once for the secret parameters** (Keycloak client secrets, `AUTH_SECRET`,
  Cloudinary, Typesense) and caches them under `~/.aspire/deployments`. The values are
  the same ones in `webapp/.env.local`.
* **A reused `postgres-data` volume will not have databases added after it was created.**
  If a service crashes at boot with `3D000: database "xDb" does not exist`, create it
  by hand — `docker exec <postgres container> createdb -U postgres xDb` — or start from
  a fresh volume.
