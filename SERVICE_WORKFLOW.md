# MERNSPACE Auth Service - Complete Workflow Guide

## Overview

This document explains the complete workflow of the MERNSPACE authentication service, from development to production deployment. It covers how the service works when you create pull requests, push code, and deploy through Docker containers.

## Service Architecture

### Core Components

- **Node.js/TypeScript Backend**: REST API service running on port 4500
- **PostgreSQL Database**: User data, tokens, and authentication records
- **JWT Authentication**: Access tokens and refresh tokens for secure API access
- **Docker Containers**: Development and production environments
- **GitHub Actions CI/CD**: Automated testing, building, and deployment

### Key Features

- User registration and login
- JWT token-based authentication
- Refresh token rotation for security
- Role-based access control
- Database migrations with TypeORM
- Comprehensive testing with Jest
- Code quality checks with ESLint and SonarCloud

## Development Workflow

### 1. Local Development Setup

```bash
# Clone repository
git clone <repository-url>
cd MERNSPACE_auth_service

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your database and JWT settings

# Run database migrations
npm run migration:run

# Start development server
npm run dev
```

### 2. Making Changes

When you make changes to the code:

1. **Code Changes**: Edit TypeScript files in `src/` directory
2. **Database Changes**: Create migrations with `npm run migration:generate`
3. **Testing**: Add/update tests in `*.spec.ts` files
4. **Linting**: Code is automatically formatted and linted on commit

### 3. Pre-commit Hooks

The service uses Husky for Git hooks:

- **Pre-commit**: Runs `lint-staged` to format and lint code
- **Formatting**: Uses Prettier for consistent code style
- **Linting**: Uses ESLint for code quality checks

## Pull Request Workflow

### What Happens When You Create a Pull Request

When you create a pull request to the `main` branch, GitHub Actions automatically triggers the CI/CD pipeline:

#### Step 1: Build and Test Job

```
1. Checkout Repository
   ↓
2. Install Dependencies (npm ci)
   ↓
3. Run ESLint (npm run lint:check)
   ↓
4. Run Tests with Coverage (npm run test)
   ↓
5. Build TypeScript (npm run build)
   ↓
6. SonarCloud Code Analysis
```

#### Database Setup for Testing

- PostgreSQL 17 container starts automatically
- Database: `postgres`
- User: `postgres`
- Password: `postgres`
- Health checks ensure database is ready

#### Test Execution

- Unit tests run with Jest
- Integration tests with real database
- Coverage reports generated
- All tests must pass for PR to be mergeable

#### Quality Gates

- **Linting**: Code must pass ESLint rules
- **Testing**: Minimum coverage requirements
- **Build**: TypeScript compilation must succeed
- **SonarCloud**: Code quality analysis (if configured)

### Pull Request Status

- **Pending**: CI/CD pipeline running
- **Success**: All checks passed, ready to merge
- **Failure**: Check logs, fix issues, push new commits

## Main Branch Push Workflow

### What Happens When You Push to Main

When code is pushed to the `main` branch, the full CI/CD pipeline runs:

#### Phase 1: Build and Test (Same as PR)

All the same checks as pull requests:
- Dependency installation
- Linting
- Testing
- Building
- Code analysis

#### Phase 2: Docker Build and Push

If Phase 1 succeeds:

```
1. Checkout Repository
   ↓
2. Login to Docker Hub
   ↓
3. Build Production Docker Image
   ↓
4. Push Image to Docker Hub
```

#### Docker Image Details

- **Repository**: `asadktk/mernstack_prod_image`
- **Tag**: `build-{github.run_number}` (e.g., `build-123`)
- **Platform**: `linux/amd64`
- **Dockerfile**: `docker/prod/Dockerfile`

## Docker Container Workflow

### Development Container

**Purpose**: Local development with hot reload

**Dockerfile**: `docker/dev/Dockerfile`

**Features**:
- Node.js 20 Alpine
- All dependencies (including dev)
- Volume mounting for code changes
- Port 4500 exposed
- Runs `npm run dev`

**Usage**:
```bash
# Build development image
docker build -f docker/dev/Dockerfile -t mern-auth-dev .

# Run with hot reload
docker run -p 4500:4500 -v .:/usr/src/app mern-auth-dev
```

### Production Container

**Purpose**: Optimized production deployment

**Dockerfile**: `docker/prod/Dockerfile`

**Multi-stage Build**:

**Stage 1 - Builder**:
- Installs all dependencies
- Compiles TypeScript to JavaScript
- Creates optimized build artifacts

**Stage 2 - Production**:
- Fresh Node.js 20 Alpine image
- Only production dependencies
- Copies compiled JavaScript from builder
- Minimal attack surface
- Runs `node server.js`

**Usage**:
```bash
# Pull latest build
docker pull asadktk/mernstack_prod_image:build-123

# Run production container
docker run -p 4500:4500 \
  -e DB_HOST=your-db-host \
  -e DB_PASSWORD=your-db-password \
  asadktk/mernstack_prod_image:build-123
```

## Authentication Flow

### User Registration

```
1. POST /auth/register
   ↓
2. Validate input with Joi
   ↓
3. Hash password with bcrypt
   ↓
4. Create user in database
   ↓
5. Generate refresh token
   ↓
6. Return success response
```

### User Login

```
1. POST /auth/login
   ↓
2. Validate credentials
   ↓
3. Compare password hash
   ↓
4. Generate JWT access token
   ↓
5. Create/update refresh token
   ↓
6. Return tokens to client
```

### Token Refresh

```
1. POST /auth/refresh
   ↓
2. Validate refresh token
   ↓
3. Check token expiration
   ↓
4. Generate new access token
   ↓
5. Rotate refresh token
   ↓
6. Return new tokens
```

## Environment Configuration

### Required Environment Variables

**Database**:
```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=mern_auth
```

**JWT Configuration**:
```env
REFRESH_TOKEN_SECRET=your-secret-key
JWKS_URI=https://your-domain.com/.well-known/jwks.json
PRIVATE_KEY=your-private-key
PUBLIC_KEY=your-public-key
```

**Application**:
```env
PORT=4500
NODE_ENV=development|production
```

### GitHub Secrets

For CI/CD pipeline, configure these in GitHub repository:

**Authentication**:
- `REFRESH_TOKEN_SECRET`
- `JWKS_URI`
- `PRIVATE_KEY`
- `PUBLIC_KEY`

**Docker Hub**:
- `DOCKERHUB_USERNAME`
- `DOCKERHUB_PASSWORD`

**Code Quality**:
- `SONAR_TOKEN`

## Deployment Scenarios

### 1. Development Environment

```bash
# Local development
npm run dev

# With Docker
docker-compose up -d
```

### 2. Staging Environment

```bash
# Pull specific build
docker pull asadktk/mernstack_prod_image:build-123

# Run with staging config
docker run -p 4500:4500 \
  --env-file .env.staging \
  asadktk/mernstack_prod_image:build-123
```

### 3. Production Environment

```bash
# Pull latest production build
docker pull asadktk/mernstack_prod_image:build-456

# Run with production config
docker run -d \
  --name auth-service \
  -p 4500:4500 \
  --restart unless-stopped \
  --env-file .env.production \
  asadktk/mernstack_prod_image:build-456
```

### 4. Kubernetes Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: auth-service
spec:
  replicas: 3
  selector:
    matchLabels:
      app: auth-service
  template:
    metadata:
      labels:
        app: auth-service
    spec:
      containers:
      - name: auth-service
        image: asadktk/mernstack_prod_image:build-456
        ports:
        - containerPort: 4500
        env:
        - name: DB_HOST
          value: "postgres-service"
        - name: NODE_ENV
          value: "production"
```

## Monitoring and Logging

### Application Logs

- **Development**: Console output with Winston logger
- **Production**: Structured JSON logs
- **Docker**: Accessible via `docker logs`

### Health Checks

```bash
# Check container health
docker ps

# Detailed health status
docker inspect container_name
```

### Metrics

- **SonarCloud**: Code quality metrics
- **Test Coverage**: Jest coverage reports
- **Build Performance**: GitHub Actions timing

## Troubleshooting Guide

### Common Issues

**Pull Request Failures**:
1. Check GitHub Actions logs
2. Run tests locally: `npm test`
3. Check linting: `npm run lint:check`
4. Verify build: `npm run build`

**Docker Issues**:
1. Check container logs: `docker logs container_name`
2. Verify environment variables
3. Check database connectivity
4. Ensure proper port mapping

**Database Issues**:
1. Check connection string
2. Run migrations: `npm run migration:run`
3. Verify database schema
4. Check PostgreSQL logs

### Debug Commands

```bash
# Local debugging
npm run dev

# Test specific test
npm test -- --testNamePattern="specific-test"

# Docker debugging
docker exec -it container_name sh

# Database debugging
docker exec -it postgres_container psql -U postgres -d mern_auth
```

## Best Practices

### Development

1. **Branch Protection**: Require PR reviews for main branch
2. **Commit Messages**: Use conventional commit format
3. **Testing**: Write tests for new features
4. **Documentation**: Update READMEs for API changes

### Security

1. **Secrets Management**: Use environment variables, never commit secrets
2. **Token Rotation**: Regular JWT key rotation
3. **Database Security**: Use connection pooling and SSL
4. **Container Security**: Minimal base images, regular updates

### Performance

1. **Database Indexing**: Proper indexes on frequently queried fields
2. **Caching**: Implement Redis for session storage
3. **Load Balancing**: Multiple container instances
4. **Monitoring**: Application performance monitoring

## Complete Workflow Summary

```
Developer makes changes
         ↓
   Git commit (auto-format/lint)
         ↓
   Push to feature branch
         ↓
   Create Pull Request
         ↓
   GitHub Actions CI/CD:
   - Install dependencies
   - Run linting
   - Run tests
   - Build project
   - Code analysis
         ↓
   PR review and merge
         ↓
   Push to main branch
         ↓
   Full CI/CD pipeline:
   - All PR checks
   - Docker build
   - Push to Docker Hub
         ↓
   Deploy to production
         ↓
   Monitor and maintain
```

This workflow ensures code quality, security, and reliable deployments for the MERNSPACE authentication service.
