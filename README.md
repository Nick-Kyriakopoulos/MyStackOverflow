# MyStackOverflow

A modern, distributed Q&A platform inspired by Stack Overflow, built to explore cloud-native architecture and microservices.

## Overview
MyStackOverflow is a comprehensive learning ground for distributed systems. The application allows users to ask questions, post answers, and manage their profiles, all while being powered by a robust, decoupled backend system orchestrated by **.NET Aspire**.

## Why I Built This
The goal of this project was to move away from a traditional monolithic architecture and implement independent microservices that handle specific domains (like Identity, Q&A functionality, and Search), seamlessly tied together with a modern Next.js user interface.

## Tech Stack & Architecture

### Frontend
* **Framework:** Next.js (React)
* **Styling:** Tailwind CSS
* **Data Fetching:** Server-Side Rendering (SSR) and Client-Side fetching

### Backend (Microservices)
* **Framework:** .NET Core Web API (C#)
* **Architecture:** Distributed Microservices 
* **Identity Provider:** Keycloak (OAuth2 / OpenID Connect for secure user authentication)

### Infrastructure & Data
* **Orchestration:** .NET Aspire (simplifies running distributed apps locally)
* **Containerization:** Docker (used to run Keycloak, databases, and message brokers)
* **Database:** PostgreSQL 
* **Message Broker:** RabbitMQ (facilitates event-driven communication between APIs)
* **Caching:** Redis

## Key Features
* **Secure Authentication:** Full user login and registration flow managed by Keycloak.
* **Microservices Architecture:** Independent backend services that communicate securely and asynchronously.
* **Responsive UI:** A fast, SEO-friendly, and modern user interface built with Next.js.
* **Cloud-Native Ready:** Designed with containers and .NET Aspire to be easily deployable to cloud environments.
