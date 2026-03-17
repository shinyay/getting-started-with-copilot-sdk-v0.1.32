# Architecture Overview

## System Design

This project follows a layered architecture:

```
┌─────────────────┐
│   API Layer      │  Express.js REST endpoints
├─────────────────┤
│   Service Layer  │  Business logic, validation
├─────────────────┤
│   Data Layer     │  Database queries, caching
└─────────────────┘
```

## Key Components

- **API Server**: Express.js application running on port 3000
- **Authentication**: JWT-based with refresh tokens
- **Database**: PostgreSQL with connection pooling
- **Cache**: Redis for session storage and API response caching
- **Queue**: Bull for background job processing

## Data Flow

1. Client sends HTTP request to API layer
2. Middleware validates JWT and rate limits
3. Service layer processes business logic
4. Data layer queries PostgreSQL or Redis cache
5. Response sent back through the stack

## Technology Stack

| Component | Technology | Version |
|-----------|-----------|---------|
| Runtime | Node.js | 20.x |
| Framework | Express.js | 4.18 |
| Database | PostgreSQL | 15 |
| Cache | Redis | 7.x |
| Language | TypeScript | 5.3 |
