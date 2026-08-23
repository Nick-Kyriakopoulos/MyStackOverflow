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

## Running It Locally

Requires Docker and the .NET 10 SDK. Aspire starts everything — services, databases,
Keycloak, RabbitMQ and Typesense — in one go:

```powershell
$env:ASPIRE_ALLOW_UNSECURED_TRANSPORT="true"
aspire run
```

The app is then at `http://localhost:3000` and the Aspire dashboard at `http://localhost:5001`.
Running the AppHost from an IDE works too, and sets that variable for you.

The web app needs `webapp/.env.local` for its Keycloak client and Cloudinary credentials.
