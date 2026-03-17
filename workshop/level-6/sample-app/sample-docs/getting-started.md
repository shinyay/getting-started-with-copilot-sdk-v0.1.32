# Getting Started

## Prerequisites

- Node.js 20+ installed
- PostgreSQL 15+ running locally
- Redis 7+ running locally

## Installation

```bash
git clone https://github.com/example/myapp.git
cd myapp
npm install
cp .env.example .env
```

## Configuration

Edit `.env` with your settings:

```
DATABASE_URL=postgresql://user:pass@localhost:5432/myapp
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-secret-key
PORT=3000
```

## Database Setup

```bash
npm run db:migrate
npm run db:seed
```

## Running

```bash
npm run dev     # Development with hot reload
npm run build   # Build for production
npm start       # Production mode
```

## Testing

```bash
npm test              # Run all tests
npm run test:unit     # Unit tests only
npm run test:e2e      # End-to-end tests
```

## Project Structure

```
src/
├── api/           # Route handlers and middleware
├── services/      # Business logic
├── models/        # Database models
├── utils/         # Shared utilities
└── config/        # Configuration management
```
