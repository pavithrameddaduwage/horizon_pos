# Horizon POS Portal Architecture

This workspace is structured as a decoupled full-stack application:

- **`backend/`**: NestJS microservices backend with TypeORM and PostgreSQL.
- **`frontend/`**: Angular 19 standalone application with Signals, RxJS, and dark glassmorphic UI.

## Quick Commands

- `npm run start:backend` - Starts NestJS dev server on `http://localhost:4000`
- `npm run start:frontend` - Starts Angular dev server on `http://localhost:4200`
- `npm run build:all` - Builds both backend and frontend applications
