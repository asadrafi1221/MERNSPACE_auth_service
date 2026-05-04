# Services Module Documentation

## Overview

The Services module contains business logic and data access operations. Services act as an intermediary between controllers and the data layer, encapsulating complex operations and maintaining separation of concerns.

## Available Services

### UserService (`src/services/UserService.ts`)

#### Purpose

Manages user-related operations including creation, authentication, and data retrieval.

#### Dependencies

- `Repository<User>`: TypeORM repository for database operations
- `CredentialService`: Password hashing and verification

#### Constructor

```typescript
constructor(userRepository: Repository<User>, credentialService: CredentialService)
```

#### Methods

##### `create(userData: UserData): Promise<User>`

- **Purpose**: Creates a new user with hashed password
- **Process**:
    1. Checks if email already exists
    2. Hashes password using CredentialService
    3. Saves user to database
    4. Returns created user without password
- **Returns**: User object (password excluded)
- **Throws**: ConflictError if email exists

##### `findByEmail(email: string): Promise<User | null>`

- **Purpose**: Finds user by email address
- **Returns**: User object or null if not found
- **Use Case**: Authentication during login

##### `findById(id: number): Promise<User | null>`

- **Purpose**: Finds user by ID
- **Returns**: User object or null if not found
- **Use Case**: Profile retrieval and token validation

#### Properties

- `credentialServiceInstance`: Exposed CredentialService instance

### TokenService (`src/services/TokenService.ts`)

#### Purpose

Handles JWT token generation, validation, and refresh token management.

#### Dependencies

- `Repository<RefreshToken>`: TypeORM repository for refresh tokens
- `Logger`: Winston logger for error tracking

#### Constructor

```typescript
constructor(refreshTokenRepository: Repository<RefreshToken>, logger: Logger)
```

#### Methods

##### `generateAccessToken(payload: JwtPayload): string`

- **Purpose**: Generates RS256-signed access token
- **Algorithm**: RS256
- **Expiration**: 1 hour
- **Key Source**: `certs/private.pem`
- **Returns**: JWT string

##### `generateRefreshToken(payload: JwtPayload, jti?: string): string`

- **Purpose**: Generates HS256-signed refresh token
- **Algorithm**: HS256
- **Expiration**: 1 year
- **Key Source**: `REFRESH_TOKEN_SECRET` environment variable
- **Optional**: JWT ID for database correlation
- **Returns**: JWT string

##### `persistRefreshToken(user: User): Promise<RefreshToken>`

- **Purpose**: Creates and saves refresh token record
- **Process**:
    1. Creates RefreshToken entity with 1-year expiration
    2. Saves to database
    3. Returns created entity
- **Returns**: RefreshToken entity

##### `deleteRefreshToken(tokenId: number): Promise<DeleteResult>`

- **Purpose**: Deletes refresh token from database
- **Use Case**: Token rotation during refresh
- **Returns**: TypeORM DeleteResult

#### Private Methods

##### `readPrivateKey(): Buffer`

- **Purpose**: Reads RSA private key from file system
- **File Path**: `certs/private.pem`
- **Returns**: Private key as Buffer
- **Throws**: HttpError if file not found

### CredentialService (`src/services/CredentialService.ts`)

#### Purpose

Handles password hashing and verification operations.

#### Dependencies

- `bcryptjs`: Password hashing library

#### Methods

##### `hashPassword(password: string): Promise<string>`

- **Purpose**: Hashes password using bcrypt
- **Salt Rounds**: 10
- **Returns**: Hashed password string

##### `comparePassword(password: string, hashedPassword: string): Promise<boolean>`

- **Purpose**: Compares plain password against hash
- **Returns**: Boolean indicating match

## Service Patterns

### Error Handling Pattern

```typescript
try {
    // Service operation
    return result;
} catch (err) {
    const error = createHttpError(statusCode, message);
    throw error;
}
```

### Repository Pattern

```typescript
constructor(private repository: Repository<Entity>) {}

async findById(id: number): Promise<Entity | null> {
  return await this.repository.findOne({ where: { id } });
}
```

### Token Generation Pattern

```typescript
// Access Token (RS256)
return sign(payload, privateKey, {
    expiresIn: '1h',
    algorithm: 'RS256',
    issuer: 'auth-service',
});

// Refresh Token (HS256)
return sign(payload, secret, {
    expiresIn: '1y',
    algorithm: 'HS256',
    issuer: 'auth-service',
    jwtid: jti,
});
```

## Data Flow

### User Registration Flow

1. `AuthController.register()` → `UserService.create()`
2. `UserService.create()` → `CredentialService.hashPassword()`
3. `UserService.create()` → `Repository.save()`
4. `AuthController.register()` → `TokenService.generateAccessToken()`
5. `AuthController.register()` → `TokenService.persistRefreshToken()`
6. `AuthController.register()` → `TokenService.generateRefreshToken()`

### User Login Flow

1. `AuthController.login()` → `UserService.findByEmail()`
2. `AuthController.login()` → `CredentialService.comparePassword()`
3. `AuthController.login()` → `TokenService.generateAccessToken()`
4. `AuthController.login()` → `TokenService.persistRefreshToken()`
5. `AuthController.login()` → `TokenService.generateRefreshToken()`

### Token Refresh Flow

1. `AuthController.refresh()` → `TokenService.generateAccessToken()`
2. `AuthController.refresh()` → `TokenService.persistRefreshToken()`
3. `AuthController.refresh()` → `TokenService.deleteRefreshToken()`
4. `AuthController.refresh()` → `TokenService.generateRefreshToken()`

## Security Considerations

### Password Security

- Uses bcrypt with 10 salt rounds
- Passwords are never stored in plain text
- Password comparison uses constant-time comparison

### Token Security

- Access tokens use RSA asymmetric encryption
- Refresh tokens use HMAC symmetric encryption
- Tokens have appropriate expiration times
- Refresh tokens are stored in database for revocation capability

### Data Protection

- Sensitive data is excluded from responses
- Private keys are read from secure file system
- Environment variables used for secrets

## Configuration Requirements

### Environment Variables

- `REFRESH_TOKEN_SECRET`: Secret for refresh token signing

### File System Requirements

- `certs/private.pem`: RSA private key for access token signing
- `certs/public.pem`: RSA public key for access token verification

### Database Requirements

- Users table with password field
- RefreshTokens table for token management

## Testing

Services are tested via unit tests that:

- Mock external dependencies
- Test business logic in isolation
- Verify error handling
- Test edge cases and boundary conditions

## Future Services

The module is designed to accommodate additional services:

- `EmailService`: Email notifications
- `AuditService`: Audit logging
- `CacheService`: Redis caching operations
- `NotificationService`: Push notifications
- `FileService`: File upload/download operations

Each new service should follow the established patterns for consistency and maintainability.
