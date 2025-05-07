# Altruvist

Altruvist is a dynamic platform that bridges the gap between passionate volunteers and meaningful opportunities at non-profit organizations and charities. Acting as a specialized task board, it enables both skilled professionals and newcomers to find and contribute to projects that create lasting social change. 

## Table of Contents
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Variables](#environment-variables)
- [Service Setup](#service-setup)
  - [MongoDB Setup](#mongodb-setup)
  - [Meilisearch Setup](#meilisearch-setup)
  - [Zitadel Authentication Setup](#zitadel-authentication-setup)
  - [S3 File Storage](#s3-file-storage)
  - [Notifications](#notifications)
- [Development](#development)
- [Testing](#testing)
- [Deployment](#deployment)
- [Docker](#docker)
- [Contributing](#contributing)

## Features

- **Task Management**: Create, browse, and apply for volunteer opportunities
- **Skill Matching**: Connect volunteers with projects based on their skills
- **Charity Management**: Tools for non-profits to manage tasks and volunteers
- **User Profiles**: Showcase volunteer skills and track impact over time
- **Search & Filter**: Find relevant tasks by skills, cause, time commitment, etc.
- **Real-time Notifications**: Updates on applications, task changes, and new opportunities
- **Resource Library**: Guides and tools to help both volunteers and organizations
- **Impact Tracking**: Measure and visualize the social impact of completed tasks

## Tech Stack

- **Frontend**: React, Tailwind CSS, Framer Motion
- **Backend**: Node.js, Remix/React Router
- **Database**: MongoDB with Prisma ORM
- **Authentication**: Zitadel (OIDC/OAuth)
- **Search**: Meilisearch
- **File Storage**: AWS S3
- **Notifications**: Novu
- **Testing**: Vitest, Playwright for E2E tests
- **Containerization**: Docker
- **CI/CD**: GitHub Actions

## Getting Started

### Prerequisites

- Node.js (v18+)
- MongoDB instance (local or cloud)
- Docker and Docker Compose (for containerized setup)

### Installation

1. Clone the repository
2. Install dependencies:
   ```
   npm ci
   ```
3. Set up environment variables (see below)
4. Generate Prisma client:
   ```
   npx prisma generate
   ```
5. Run the development server:
   ```
   npm run dev
   ```

### Environment Variables

Copy `.env.example` to `.env` and populate with your configuration:

```
# MongoDB connection
DATABASE_URL=mongodb+srv://<username>:<password>@<cluster>/<database>?retryWrites=true&w=majority

# Zitadel Auth
ZITADEL_DOMAIN=
CLIENT_ID=
CLIENT_SECRET=
REDIRECT_URI=
LOGOUT_URI=
STATE=
SESSION_SECRET=

# Meilisearch
MEILI_MASTER_KEY=
MEILI_HOST=
MEILI_ENVIRONMENT=

# Novu Notifications
NOVU_API_KEY=

# AWS S3
AWS_ACCESS_KEY_ID=
AWS_SECRET=
AWS_REGION=
AWS_BUCKET=
```

## Service Setup

### MongoDB Setup

1. Create a MongoDB cluster (Atlas or self-hosted)
2. Create a database
3. Create a user with read/write permissions
4. Update the DATABASE_URL in your `.env` file
5. Initialize the database schema:
   ```
   npx prisma db push
   ```

### Meilisearch Setup

1. Ensure Meilisearch is running (via Docker or standalone)
2. Configure the MEILI_* environment variables
3. The application will automatically set up indexes and settings on startup

### Zitadel Authentication Setup

1. Run Docker Compose for Zitadel:
   ```
   docker-compose -f docker-compose.yaml up zitadel -d
   ```

2. If Zitadel cannot start (repeatedly restarts), it might have trouble with data persistence. Run:
   ```
   docker container prune
   ```
   to delete stale data in the postgres pod.

3. Access Zitadel behind Traefik at http://127.0.0.1.sslip.io:7200

4. Import organisation config using PAT token (created locally under machinekey folder) through Postman:
   - Use Bearer Token authorization
   - Make "Skillanthropy" the default organization
   - Add localhost:5173 as default redirect URI at the bottom of the login behavior and security sections

5. Update client ID application environment variable:
   - Find under projects named "skillanthropy"
   - And Zitadel application named "skillanthropy"

6. For user sign-up functionality, configure an SMTP provider in Zitadel settings

### S3 File Storage

1. Set up an AWS S3 bucket
2. Configure the AWS_* environment variables

### Notifications

1. Create a Novu account and project
2. Set the NOVU_API_KEY environment variable

## Development

```
# Start development server
npm run dev

# Type checking
npm run typecheck

# Linting
npm run lint

# Formatting
npm run format
```

## Testing

```
# Unit tests
npm test

# E2E tests
npm run test:e2e

# E2E with UI
npm run test:e2e:ui
```

## Deployment

The application can be deployed using the provided Docker setup or through your preferred hosting service.

## Docker

Build and run the application with Docker:

```
docker build -t altruvist .
docker run -p 3000:3000 altruvist
```

Or use Docker Compose:

```
docker-compose up -d
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
