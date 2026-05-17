# CI/CD Pipeline Documentation

## Overview

This project uses GitHub Actions for continuous integration and continuous deployment (CI/CD). The pipeline is configured in `.github/workflows/ci.yaml` and automates testing, building, and deployment processes.

## Pipeline Triggers

The CI/CD pipeline is triggered on:
- **Pull requests** to the `main` branch
- **Pushes** to the `main` branch

## Pipeline Jobs

### 1. Build and Test Job

**Purpose**: Runs comprehensive tests and builds the application

**Environment**: Ubuntu Latest

**Services**: 
- PostgreSQL 17 (for database testing)

**Steps**:
1. **Checkout Repository**: Downloads the source code
2. **Install Dependencies**: Runs `npm ci` for clean dependency installation
3. **Linting**: Executes ESLint with `npm run lint:check`
4. **Testing**: Runs unit tests with coverage using `npm run test`
5. **Build**: Compiles TypeScript with `npm run build`
6. **SonarCloud Scan**: Performs code quality analysis

**Environment Variables for Testing**:
```yaml
DB_HOST: localhost
DB_PORT: 5432
DB_USERNAME: postgres
DB_PASSWORD: postgres
DB_NAME: postgres
REFRESH_TOKEN_SECRET: ${{ secrets.REFRESH_TOKEN_SECRET }}
JWKS_URI: ${{ secrets.JWKS_URI }}
PRIVATE_KEY: ${{ secrets.PRIVATE_KEY }}
PUBLIC_KEY: ${{ secrets.PUBLIC_KEY }}
```

### 2. Build and Push Docker Job

**Purpose**: Builds and pushes Docker image to Docker Hub

**Triggers**: Only runs on pushes to `main` branch (not on pull requests)

**Prerequisites**: Depends on successful completion of build-and-test job

**Steps**:
1. **Checkout Repository**: Downloads the source code
2. **Docker Login**: Authenticates with Docker Hub
3. **Build Docker Image**: Creates production Docker image
4. **Push to Docker Hub**: Uploads image to registry

**Docker Configuration**:
- **Image Name**: `asadktk/mernstack_prod_image`
- **Image Tag**: `build-${{ github.run_number }}`
- **Platform**: `linux/amd64`
- **Dockerfile**: `docker/prod/Dockerfile`

## Required GitHub Secrets

To use this CI/CD pipeline, configure the following secrets in your GitHub repository:

### Authentication & Security
- `REFRESH_TOKEN_SECRET`: Secret key for refresh token generation
- `JWKS_URI`: JSON Web Key Set URI for JWT validation
- `PRIVATE_KEY`: Private key for JWT signing
- `PUBLIC_KEY`: Public key for JWT verification

### Docker Hub
- `DOCKERHUB_USERNAME`: Docker Hub username
- `DOCKERHUB_PASSWORD`: Docker Hub password or access token

### Code Quality
- `SONAR_TOKEN`: SonarCloud authentication token
- `GITHUB_TOKEN`: Automatically provided by GitHub Actions

## Database Setup for Tests

The pipeline uses PostgreSQL 17 for testing. The database is automatically configured with:

- **Host**: localhost
- **Port**: 5432
- **User**: postgres
- **Password**: postgres
- **Database**: postgres

The database health check ensures PostgreSQL is ready before running tests.

## Build Process

### Development Build
- Uses `docker/dev/Dockerfile`
- Installs all dependencies including devDependencies
- Runs in development mode with hot reload

### Production Build
- Uses `docker/prod/Dockerfile`
- Multi-stage build process
- Builder stage: Installs dependencies and builds TypeScript
- Production stage: Copies only built artifacts
- Optimized for production deployment

## Quality Gates

The pipeline includes several quality gates:

1. **Linting**: Code must pass ESLint rules
2. **Testing**: All tests must pass
3. **Build**: TypeScript compilation must succeed
4. **SonarCloud**: Code quality analysis (if configured)

## Troubleshooting

### Common Issues

1. **Database Connection Errors**
   - Ensure PostgreSQL service is healthy
   - Check database environment variables

2. **Docker Push Failures**
   - Verify Docker Hub credentials
   - Check Docker Hub repository permissions

3. **SonarCloud Issues**
   - Ensure SONAR_TOKEN is valid
   - Check SonarCloud project configuration

4. **Build Failures**
   - Check TypeScript compilation errors
   - Verify all dependencies are installed

### Debugging Tips

- Check the GitHub Actions logs for detailed error messages
- Use the `Actions` tab in your GitHub repository to monitor pipeline runs
- For local testing, use the same environment variables as the pipeline

## Local Development

To run the same checks locally:

```bash
# Install dependencies
npm ci

# Run linting
npm run lint:check

# Run tests
npm run test

# Build project
npm run build
```

## Deployment

When code is pushed to the `main` branch:
1. All tests and quality checks run
2. If successful, a Docker image is built
3. The image is tagged with the build number
4. The image is pushed to Docker Hub

The deployed image can then be pulled and run in production environments.

## Configuration Files

- `.github/workflows/ci.yaml`: Main CI/CD pipeline configuration
- `docker/dev/Dockerfile`: Development Docker configuration
- `docker/prod/Dockerfile`: Production Docker configuration
- `sonar-project.properties`: SonarCloud configuration
