# Docker Setup Documentation

## Overview

This project uses Docker for containerization with separate configurations for development and production environments. Docker ensures consistent environments across different machines and simplifies deployment.

## Docker Architecture

The project includes two Docker configurations:

- **Development**: `docker/dev/Dockerfile` - For local development with hot reload
- **Production**: `docker/prod/Dockerfile` - Multi-stage build for optimized production deployment

## Development Docker Setup

### Dockerfile: `docker/dev/Dockerfile`

**Base Image**: `node:20-alpine`

**Features**:
- Lightweight Alpine Linux base
- Development dependencies included
- Hot reload capability
- Port 4500 exposed

**Build Process**:
1. Sets working directory to `/usr/src/app`
2. Copies package files and installs all dependencies
3. Copies application source code
4. Exposes port 4500
5. Runs development server with `npm run dev`

### Running Development Container

```bash
# Build the development image
docker build -f docker/dev/Dockerfile -t mern-auth-dev .

# Run the development container
docker run -p 4500:4500 mern-auth-dev

# Or with volume mounting for hot reload
docker run -p 4500:4500 -v .:/usr/src/app mern-auth-dev
```

### Development Environment Variables

Create a `.env` file or pass environment variables:

```bash
docker run -p 4500:4500 \
  -e DB_HOST=localhost \
  -e DB_PORT=5432 \
  -e DB_USERNAME=postgres \
  -e DB_PASSWORD=postgres \
  -e DB_NAME=mern_auth \
  mern-auth-dev
```

## Production Docker Setup

### Dockerfile: `docker/prod/Dockerfile`

**Architecture**: Multi-stage build

**Stages**:
1. **Builder Stage**: Compiles TypeScript and installs dependencies
2. **Production Stage**: Optimized runtime with only necessary files

### Builder Stage

**Base Image**: `node:20-alpine`

**Process**:
1. Sets working directory to `/app`
2. Copies package files and installs dependencies
3. Copies source code
4. Builds TypeScript with `npm run build`

### Production Stage

**Base Image**: `node:20-alpine`

**Features**:
- Production-optimized environment
- Only production dependencies installed
- Built artifacts copied from builder stage
- Minimal attack surface

**Process**:
1. Sets `NODE_ENV=prod`
2. Installs production dependencies only
3. Copies compiled JavaScript from builder
4. Exposes port 4500
5. Runs with `node server.js`

### Building Production Image

```bash
# Build production image
docker build -f docker/prod/Dockerfile -t mern-auth-prod .

# Tag for Docker Hub
docker tag mern-auth-prod username/mernstack_prod_image:latest

# Run production container
docker run -p 4500:4500 mern-auth-prod
```

## Docker Compose (Optional)

For local development with database, create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: docker/dev/Dockerfile
    ports:
      - "4500:4500"
    environment:
      - DB_HOST=postgres
      - DB_PORT=5432
      - DB_USERNAME=postgres
      - DB_PASSWORD=postgres
      - DB_NAME=mern_auth
    depends_on:
      - postgres
    volumes:
      - .:/usr/src/app

  postgres:
    image: postgres:17
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=postgres
      - POSTGRES_DB=mern_auth
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

### Running with Docker Compose

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## Environment Configuration

### Required Environment Variables

**Database Configuration**:
- `DB_HOST`: Database server host
- `DB_PORT`: Database server port (default: 5432)
- `DB_USERNAME`: Database username
- `DB_PASSWORD`: Database password
- `DB_NAME`: Database name

**Authentication Configuration**:
- `REFRESH_TOKEN_SECRET`: Secret for refresh token generation
- `JWKS_URI`: JSON Web Key Set URI
- `PRIVATE_KEY`: Private key for JWT signing
- `PUBLIC_KEY`: Public key for JWT verification

**Application Configuration**:
- `PORT`: Application port (default: 4500)
- `NODE_ENV`: Environment (development/production)

## Docker Best Practices

### Image Optimization

1. **Multi-stage builds**: Separate build and runtime environments
2. **Alpine Linux**: Use lightweight base images
3. **.dockerignore**: Exclude unnecessary files
4. **Layer caching**: Order operations from least to most frequently changed

### Security Considerations

1. **Non-root user**: Run as non-privileged user (if needed)
2. **Minimal base images**: Reduce attack surface
3. **Secrets management**: Use Docker secrets or environment files
4. **Regular updates**: Keep base images updated

### Performance Optimization

1. **Resource limits**: Set memory and CPU limits
2. **Health checks**: Implement container health monitoring
3. **Graceful shutdown**: Handle SIGTERM properly
4. **Logging**: Structured logging for monitoring

## Deployment Options

### Docker Hub

The CI/CD pipeline automatically pushes to Docker Hub:

```bash
# Pull latest image
docker pull asadktk/mernstack_prod_image:build-{number}

# Run production container
docker run -p 4500:4500 asadktk/mernstack_prod_image:build-{number}
```

### Private Registry

For private deployments:

```bash
# Tag for private registry
docker tag mern-auth-prod private-registry.com/mern-auth:latest

# Push to private registry
docker push private-registry.com/mern-auth:latest

# Pull and run
docker pull private-registry.com/mern-auth:latest
docker run -p 4500:4500 private-registry.com/mern-auth:latest
```

### Kubernetes Deployment

For Kubernetes clusters:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: mern-auth-service
spec:
  replicas: 3
  selector:
    matchLabels:
      app: mern-auth
  template:
    metadata:
      labels:
        app: mern-auth
    spec:
      containers:
      - name: mern-auth
        image: asadktk/mernstack_prod_image:build-123
        ports:
        - containerPort: 4500
        env:
        - name: DB_HOST
          value: "postgres-service"
```

## Troubleshooting

### Common Issues

1. **Port Conflicts**
   ```bash
   # Check port usage
   lsof -i :4500
   
   # Use different port
   docker run -p 4501:4500 mern-auth-prod
   ```

2. **Database Connection Errors**
   ```bash
   # Check database connectivity
   docker exec -it container_name ping postgres
   
   # Verify environment variables
   docker exec -it container_name env | grep DB_
   ```

3. **Build Failures**
   ```bash
   # Clean build
   docker builder prune
   
   # Rebuild without cache
   docker build --no-cache -f docker/prod/Dockerfile .
   ```

4. **Permission Issues**
   ```bash
   # Check file permissions
   docker exec -it container_name ls -la
   
   # Fix ownership issues
   docker run --user node:node mern-auth-prod
   ```

### Debugging Commands

```bash
# View container logs
docker logs container_name

# Interactive shell
docker exec -it container_name sh

# Inspect container
docker inspect container_name

# Resource usage
docker stats container_name
```

## Development Workflow

### Local Development

1. Make code changes
2. Rebuild development image:
   ```bash
   docker build -f docker/dev/Dockerfile -t mern-auth-dev .
   ```
3. Run with volume mounting for hot reload
4. Test changes

### Production Deployment

1. Ensure all tests pass
2. Push to main branch (triggers CI/CD)
3. CI/CD builds and pushes Docker image
4. Pull and run production image in target environment

## Configuration Files

- `docker/dev/Dockerfile`: Development container configuration
- `docker/prod/Dockerfile`: Production container configuration
- `.dockerignore`: Files excluded from Docker build
- `docker-compose.yml`: Local development setup (optional)
