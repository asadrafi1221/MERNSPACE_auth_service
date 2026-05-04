# Authentication Module Documentation

## Overview

The Authentication module handles user registration, login, token management, and protected route access. It uses JWT tokens with RS256 for access tokens and HS256 for refresh tokens.

## Architecture

### Components

1. **AuthController** (`src/controllers/AuthController.ts`)
    - Handles HTTP requests for authentication endpoints
    - Manages user registration, login, self-profile, and token refresh

2. **TokenService** (`src/services/TokenService.ts`)
    - Generates and validates JWT tokens
    - Manages refresh token persistence and deletion
    - Handles RSA key pair for token signing

3. **UserService** (`src/services/UserService.ts`)
    - Manages user CRUD operations
    - Handles password hashing and verification
    - Integrates with CredentialService for password management

4. **Middleware**
    - `authenticate.ts` - Validates access tokens using public key verification
    - `validateRefreshToken.ts` - Validates refresh tokens against database

## API Endpoints

### POST `/auth/register`

- **Description**: Register a new user
- **Body**:
    ```json
    {
        "firstName": "string",
        "lastName": "string",
        "email": "string",
        "password": "string"
    }
    ```
- **Response**:
    ```json
    {
        "id": "number"
    }
    ```
- **Cookies**: Sets `accessToken` and `refreshToken` HTTP-only cookies

### POST `/auth/login`

- **Description**: Authenticate user and issue tokens
- **Body**:
    ```json
    {
        "email": "string",
        "password": "string"
    }
    ```
- **Response**:
    ```json
    {
        "id": "number"
    }
    ```
- **Cookies**: Sets `accessToken` and `refreshToken` HTTP-only cookies

### GET `/auth/self`

- **Description**: Get current user profile
- **Authentication**: Requires valid access token
- **Response**:
    ```json
    {
        "id": "number",
        "firstName": "string",
        "lastName": "string",
        "email": "string",
        "role": "string"
    }
    ```

### POST `/auth/refresh`

- **Description**: Refresh access token using refresh token
- **Authentication**: Requires valid refresh token cookie
- **Response**:
    ```json
    {
        "id": "number"
    }
    ```
- **Cookies**: Updates `accessToken` and `refreshToken` cookies

## Token Management

### Access Token

- **Algorithm**: RS256
- **Expiration**: 1 hour
- **Payload**:
    ```json
    {
        "sub": "user_id",
        "role": "user_role",
        "iat": "timestamp",
        "exp": "timestamp",
        "iss": "auth-service"
    }
    ```

### Refresh Token

- **Algorithm**: HS256
- **Expiration**: 1 year
- **Payload**:
    ```json
    {
        "sub": "user_id",
        "role": "user_role",
        "jti": "token_id",
        "iat": "timestamp",
        "exp": "timestamp",
        "iss": "auth-service"
    }
    ```

## Security Features

1. **RSA Key Pair**: Uses private/public key pair for access token signing
2. **HTTP-Only Cookies**: Tokens stored in secure HTTP-only cookies
3. **Token Rotation**: Refresh tokens are rotated on each use
4. **Database Validation**: Refresh tokens validated against database
5. **Token Revocation**: Old refresh tokens are deleted after rotation

## Configuration

### Environment Variables

- `REFRESH_TOKEN_SECRET`: Secret for refresh token signing
- `JWKS_URI`: JWKS endpoint (not used in current implementation)

### Certificates

- `certs/private.pem`: RSA private key for access token signing
- `certs/public.pem`: RSA public key for access token verification

## Database Schema

### RefreshToken Entity

```typescript
{
  id: number,           // Primary key
  expiresAt: Date,      // Token expiration
  user: User,           // Foreign key to User
  createdAt: Date,
  updatedAt: Date
}
```

## Error Handling

### Common Errors

- **401 Unauthorized**: Invalid credentials, missing/invalid tokens
- **404 Not Found**: User not found during refresh
- **409 Conflict**: Email already exists during registration
- **500 Internal Server Error**: Database or system errors

### Error Response Format

```json
{
    "error": "error_message",
    "statusCode": "number"
}
```

## Dependencies

- `express`: Web framework
- `jsonwebtoken`: JWT token handling
- `typeorm`: ORM for database operations
- `bcryptjs`: Password hashing
- `express-jwt`: JWT middleware
- `http-errors`: HTTP error creation
- `winston`: Logging

## Usage Example

```typescript
// Register user
POST /auth/register
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "password": "securePassword123"
}

// Access protected route
GET /auth/self
Headers: Cookie: accessToken=<jwt_token>

// Refresh tokens
POST /auth/refresh
Headers: Cookie: refreshToken=<jwt_token>
```

## Testing

The module includes comprehensive tests covering:

- User registration and login flows
- Token validation and refresh
- Error scenarios
- Protected route access

Run tests with: `npm test -- auth.spec.ts`
