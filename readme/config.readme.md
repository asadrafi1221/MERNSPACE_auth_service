# Configuration Module Documentation

## Overview

The Configuration module handles application configuration, environment variables, database connections, logging setup, and other system-wide settings. It provides a centralized way to manage application behavior across different environments.

## Configuration Files

### Main Configuration (`src/config/index.ts`)

#### Purpose

Central configuration management using environment variables with support for different environments (development, test, production).

#### Environment Loading

```typescript
import { config } from 'dotenv';
import path from 'path';

config({ path: path.join(__dirname, `../../.env.${process.env.NODE_ENV}`) });
```

#### Environment Variables

```typescript
const {
    PORT,
    NODE_ENV,
    DB_HOST,
    DB_PORT,
    DB_USERNAME,
    DB_PASSWORD,
    DB_NAME,
    REFRESH_TOKEN_SECRET,
    JWKS_URI,
} = process.env;
```

#### Exported Configuration

```typescript
export const CONFIG = {
    PORT,
    NODE_ENV,
    DB_HOST,
    DB_PORT,
    DB_USERNAME,
    DB_PASSWORD,
    DB_NAME,
    REFRESH_TOKEN_SECRET,
    JWKS_URI,
};
```

#### Environment Files

- `.env.development`: Development environment variables
- `.env.test`: Test environment variables
- `.env.production`: Production environment variables

### Database Configuration (`src/config/data-source.ts`)

#### Purpose

TypeORM data source configuration for database connections and entity management.

#### Data Source Setup

```typescript
export const AppDataSource = new DataSource({
    type: 'postgres',
    host: CONFIG.DB_HOST,
    port: Number(CONFIG.DB_PORT),
    username: CONFIG.DB_USERNAME,
    password: CONFIG.DB_PASSWORD,
    database: CONFIG.DB_NAME,
    synchronize: false,
    logging: CONFIG.NODE_ENV === 'development',
    entities: [User, RefreshToken],
    migrations: ['src/migrations/*.ts'],
    subscribers: ['src/subscribers/*.ts'],
});
```

#### Configuration Options

- **Database Type**: PostgreSQL
- **Synchronization**: Disabled (manual migrations)
- **Logging**: Enabled only in development
- **Entities**: User and RefreshToken entities
- **Migrations**: Database migration files
- **Subscribers**: TypeORM event subscribers

#### Initialization

```typescript
// Initialize database connection
await AppDataSource.initialize();
console.log('Data Source has been initialized!');
```

### Logger Configuration (`src/config/logger.ts`)

#### Purpose

Winston logger configuration for structured logging across the application.

#### Logger Setup

```typescript
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json(),
    ),
    defaultMeta: { serviceName: 'auth-service' },
    transports: [
        new winston.transports.File({ filename: 'error.log', level: 'error' }),
        new winston.transports.File({ filename: 'combined.log' }),
    ],
});
```

#### Environment-Specific Configuration

```typescript
if (CONFIG.NODE_ENV !== 'production') {
    logger.add(
        new winston.transports.Console({
            format: winston.format.simple(),
        }),
    );
}
```

#### Log Levels

- **error**: Error messages and exceptions
- **warn**: Warning messages
- **info**: General information messages
- **debug**: Debug information (development only)

#### Log Format

```typescript
// Log structure
{
  level: 'info',
  message: 'User has been created',
  serviceName: 'auth-service',
  timestamp: '2026-05-04T08:32:20.471Z',
  id: 1750
}
```

## Environment Variables

### Required Variables

#### Application Configuration

- `NODE_ENV`: Environment (development/test/production)
- `PORT`: Server port number

#### Database Configuration

- `DB_HOST`: Database server hostname
- `DB_PORT`: Database server port
- `DB_USERNAME`: Database username
- `DB_PASSWORD`: Database password
- `DB_NAME`: Database name

#### Security Configuration

- `REFRESH_TOKEN_SECRET`: Secret for refresh token signing
- `JWKS_URI`: JWKS endpoint URL (optional)

### Environment File Examples

#### Development (.env.development)

```env
PORT=3000
NODE_ENV=development
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=password
DB_NAME=auth_dev
REFRESH_TOKEN_SECRET=your-refresh-secret-here
JWKS_URI=http://localhost:4500/.well-known/jwks.json
```

#### Test (.env.test)

```env
PORT=0
NODE_ENV=test
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=password
DB_NAME=auth_test
REFRESH_TOKEN_SECRET=test-refresh-secret
JWKS_URI=http://localhost:4500/.well-known/jwks.json
```

#### Production (.env.production)

```env
PORT=3000
NODE_ENV=production
DB_HOST=prod-db-host
DB_PORT=5432
DB_USERNAME=prod_user
DB_PASSWORD=secure_password
DB_NAME=auth_prod
REFRESH_TOKEN_SECRET=super-secure-production-secret
JWKS_URI=https://your-domain.com/.well-known/jwks.json
```

## Database Configuration

### Connection Options

- **Type**: PostgreSQL
- **SSL**: Configurable for production
- **Pool**: Connection pooling for performance
- **Timeout**: Configurable connection timeouts

### Entity Management

- **Auto-Sync**: Disabled (manual migrations)
- **Logging**: Environment-specific
- **Caching**: Configurable entity caching

### Migration Strategy

```typescript
// Migration files location
migrations: ['src/migrations/*.ts']

// Run migrations
npm run migration:run

// Create new migration
npm run migration:generate -- -n MigrationName
```

## Logging Configuration

### Transport Configuration

- **File Transport**: Error and combined logs
- **Console Transport**: Development console output
- **External Services**: Configurable for production

### Log Formats

- **JSON Format**: Structured logging for production
- **Simple Format**: Human-readable for development
- **Error Stack Traces**: Included for debugging

### Log Levels by Environment

- **Development**: All levels including debug
- **Test**: Error and warn levels only
- **Production**: Error, warn, and info levels

## Security Configuration

### Token Security

- **Refresh Token Secret**: Minimum 32 characters
- **JWT Configuration**: Algorithm and expiration settings
- **Key Rotation**: Support for key rotation strategies

### Database Security

- **Connection Security**: SSL/TLS configuration
- **Credentials Management**: Environment variable storage
- **Access Control**: Database user permissions

### Application Security

- **CORS Configuration**: Cross-origin request settings
- **Rate Limiting**: API request throttling
- **Helmet Integration**: Security headers configuration

## Performance Configuration

### Database Performance

- **Connection Pooling**: Optimal pool size configuration
- **Query Optimization**: Index and query performance settings
- **Caching Strategy**: Redis integration options

### Application Performance

- **Compression**: Response compression settings
- **Static Assets**: CDN and caching configuration
- **Memory Management**: Node.js memory limits

## Configuration Patterns

### Environment-Specific Loading

```typescript
config({ path: path.join(__dirname, `../../.env.${process.env.NODE_ENV}`) });
```

### Configuration Validation

```typescript
// Validate required configuration
if (!CONFIG.REFRESH_TOKEN_SECRET) {
    throw new Error('REFRESH_TOKEN_SECRET is required');
}
```

### Default Values

```typescript
export const CONFIG = {
    PORT: PORT || 3000,
    NODE_ENV: NODE_ENV || 'development',
    // ... other configurations with defaults
};
```

## Testing Configuration

### Test Database

- **Isolation**: Separate test database
- **Cleanup**: Automated test data cleanup
- **Transactions**: Rollback after each test

### Test Environment

- **Mock Services**: External service mocking
- **Logging**: Minimal logging during tests
- **Performance**: Optimized for test execution

## Deployment Configuration

### Docker Configuration

```dockerfile
# Environment variables in Docker
ENV NODE_ENV=production
ENV PORT=3000
ENV DB_HOST=database
```

### Environment Variables in Production

- **Secret Management**: AWS Secrets Manager / Vault
- **Configuration Service**: External configuration service
- **Health Checks**: Application health monitoring

## Monitoring Configuration

### Application Metrics

- **Performance Metrics**: Response times and throughput
- **Error Metrics**: Error rates and types
- **Business Metrics**: User activity and engagement

### Health Checks

```typescript
// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
    });
});
```

## Configuration Best Practices

### Security

- **Secret Management**: Never commit secrets to version control
- **Environment Isolation**: Separate configs per environment
- **Access Control**: Limit access to configuration files

### Maintainability

- **Documentation**: Clear configuration documentation
- **Validation**: Configuration validation at startup
- **Defaults**: Sensible default values

### Performance

- **Lazy Loading**: Load configuration only when needed
- **Caching**: Cache expensive configuration lookups
- **Monitoring**: Monitor configuration changes and impacts

## Future Configuration

The module is designed to accommodate additional configuration:

- **Feature Flags**: Dynamic feature toggles
- **Service Discovery**: Microservice configuration
- **Cache Configuration**: Redis and other caching systems
- **Message Queue Configuration**: RabbitMQ, Kafka integration
- **External API Configuration**: Third-party service settings

Each new configuration should follow the established patterns for consistency and maintainability.
