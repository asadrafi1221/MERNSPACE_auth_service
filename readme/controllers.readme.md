# Controllers Module Documentation

## Overview

The Controllers module contains request handlers that manage HTTP requests and responses. Each controller is responsible for a specific domain of the application.

## Available Controllers

### AuthController (`src/controllers/AuthController.ts`)

#### Purpose

Handles all authentication-related HTTP requests including user registration, login, profile access, and token refresh.

#### Dependencies

- `UserService`: User management operations
- `TokenService`: JWT token generation and validation
- `Logger`: Winston logger for error tracking

#### Methods

##### `register(req: RegisterUserRequest, res: Response, next: NextFunction)`

- **Route**: `POST /auth/register`
- **Purpose**: Creates a new user account
- **Process**:
    1. Extracts user data from request body
    2. Creates user via UserService
    3. Generates access and refresh tokens
    4. Sets HTTP-only cookies
    5. Returns user ID
- **Success Response**: `{ id: number }`
- **Status Code**: 201 Created

##### `login(req: LoginUserRequest, res: Response, next: NextFunction)`

- **Route**: `POST /auth/login`
- **Purpose**: Authenticates user and issues tokens
- **Process**:
    1. Validates credentials via UserService
    2. Generates access and refresh tokens
    3. Sets HTTP-only cookies
    4. Returns user ID
- **Success Response**: `{ id: number }`
- **Status Code**: 200 OK

##### `self(req: AuthRequest, res: Response)`

- **Route**: `GET /auth/self`
- **Purpose**: Returns current user profile
- **Authentication**: Requires valid access token
- **Process**:
    1. Extracts user ID from authenticated request
    2. Fetches user data via UserService
    3. Returns user data without password
- **Success Response**: User object without password
- **Status Code**: 200 OK

##### `refresh(req: AuthRequest, res: Response, next: NextFunction)`

- **Route**: `POST /auth/refresh`
- **Purpose**: Refreshes access and refresh tokens
- **Authentication**: Requires valid refresh token
- **Process**:
    1. Extracts user data from authenticated request
    2. Generates new access token
    3. Creates new refresh token
    4. Deletes old refresh token from database
    5. Sets new HTTP-only cookies
    6. Returns user ID
- **Success Response**: `{ id: number }`
- **Status Code**: 200 OK

#### Error Handling

All methods use `next(err)` for error forwarding, allowing middleware to handle error responses consistently.

#### Request Types

- `RegisterUserRequest`: Extends Express Request with typed body
- `LoginUserRequest`: Extends Express Request with typed body
- `AuthRequest`: Extends Express Request with authenticated user data

## Controller Patterns

### Error Handling Pattern

```typescript
try {
    // Controller logic
} catch (err) {
    next(err);
    return;
}
```

### Response Pattern

```typescript
// Success responses
res.status(201).send({ id: user.id });
res.json({ ...user, password: undefined });

// Error responses handled by middleware
next(err);
```

### Token Management Pattern

```typescript
const payload: JwtPayload = {
    sub: user.id?.toString() || '',
    role: user.role,
};

const accessToken = this.tokenService.generateAccessToken(payload);
const refreshToken = this.tokenService.generateRefreshToken(payload, jti);
setTokenCookies(res, accessToken, refreshToken);
```

## Best Practices

1. **Dependency Injection**: Controllers receive dependencies via constructor
2. **Separation of Concerns**: Business logic delegated to services
3. **Type Safety**: Use typed request interfaces
4. **Error Forwarding**: Use `next(err)` for consistent error handling
5. **Logging**: Log important operations and errors
6. **Security**: Never expose sensitive data in responses

## Testing

Controllers are tested via integration tests that:

- Make HTTP requests to endpoints
- Validate response status codes and data
- Test error scenarios
- Verify cookie setting behavior

## Future Controllers

The module is designed to easily accommodate additional controllers:

- `UserController`: User profile management
- `AdminController`: Administrative operations
- `ProductController`: Product management
- etc.

Each new controller should follow the established patterns for consistency.
