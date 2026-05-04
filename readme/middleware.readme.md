# Middleware Module Documentation

## Overview

The Middleware module contains Express middleware functions that handle request processing, authentication, validation, and error handling. Middleware functions execute in the request-response cycle and can modify requests, responses, or terminate the cycle.

## Available Middleware

### Authentication Middleware

#### `authenticate.ts` - Access Token Validation

##### Purpose

Validates JWT access tokens using RSA public key verification and attaches decoded user data to the request object.

##### Export

```typescript
export const protect = expressjwt({...})
```

##### Configuration

- **Secret**: RSA public key from `certs/public.pem`
- **Algorithms**: `['RS256']`
- **Request Property**: `auth`
- **Credentials Required**: `true`

##### Token Extraction Logic

```typescript
getToken: (req: Request) => {
    try {
        // 1. Check Authorization header
        const authHeader = req.headers.authorization;
        if (authHeader) {
            const parts = authHeader.split(' ');
            if (parts.length === 2 && parts[1] !== 'undefined') {
                return parts[1]; // Bearer token
            }
        }

        // 2. Check cookies
        const { accessToken } = req.cookies as AuthCookie;
        return accessToken;
    } catch (err) {
        // Error logging
    }
};
```

##### Request Augmentation

After successful validation, the request object includes:

```typescript
req.auth = {
  sub: number,    // User ID
  role: string,   // User role
  jti?: string    // JWT ID (for refresh tokens)
}
```

##### Usage

```typescript
authRouter.get('/self', protect, async (req, res) => {
    await authController.self(req as AuthRequest, res);
});
```

#### `validateRefreshToken.ts` - Refresh Token Validation

##### Purpose

Validates JWT refresh tokens using HMAC verification and database persistence check.

##### Export

```typescript
export default expressjwt({...})
```

##### Configuration

- **Secret**: `CONFIG.REFRESH_TOKEN_SECRET!`
- **Algorithms**: `['HS256']`
- **Credentials Required**: `true`

##### Token Extraction

```typescript
getToken(req: Request) {
  const { refreshToken } = req.cookies as AuthCookie;
  if (!refreshToken) {
    throw createHttpError(401, 'Refresh token required');
  }
  return refreshToken;
}
```

##### Token Revocation Check

```typescript
async isRevoked(request: Request, token) {
  try {
    const payload = token.payload as JwtPayload;

    // Check if refresh token exists in database
    const refreshToken = await refreshTokenRepository.findOne({
      where: {
        id: Number(payload?.jti),        // JWT ID
        user: { id: Number(payload?.sub) } // User ID
      },
    });

    // Return true if token doesn't exist (revoked)
    return !refreshToken;
  } catch (err) {
    // Log error and revoke token
    return true;
  }
}
```

##### Usage

```typescript
authRouter.post('/refresh', validateRefreshToken, async (req, res, next) => {
    await authController.refresh(req as AuthRequest, res, next);
});
```

### Validation Middleware

#### `validation.ts` - Request Body Validation

##### Purpose

Validates request bodies against Joi schemas before processing.

##### Export

```typescript
export const validate = (schema: ObjectSchema) => {
    return (req: Request, res: Response, next: NextFunction) => {
        // Validation logic
    };
};
```

##### Validation Process

1. Extracts request body
2. Validates against provided schema
3. On success: calls `next()`
4. On failure: sends 400 Bad Request with error details

##### Usage Example

```typescript
authRouter.post(
    '/register',
    validate(registerUserSchema),
    async (req, res, next) => await authController.register(req, res, next),
);
```

## Middleware Patterns

### Error Handling Pattern

```typescript
try {
    // Middleware logic
    return result;
} catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    logger.error('Error description', { error: errorMessage });
    return true; // or throw error
}
```

### Token Validation Pattern

```typescript
export const protect = expressjwt({
    secret: publicKey,
    algorithms: ['RS256'],
    requestProperty: 'auth',
    credentialsRequired: true,
    getToken: (req: Request) => {
        // Custom token extraction logic
    },
});
```

### Request Validation Pattern

```typescript
export const validate = (schema: ObjectSchema) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const { error } = schema.validate(req.body);
        if (error) {
            return res.status(400).json({ error: error.details[0].message });
        }
        next();
    };
};
```

## Request Flow

### Protected Route Request Flow

1. **Request arrives** at protected endpoint
2. **Authentication middleware** validates access token
3. **Token verification** using RSA public key
4. **Request augmentation** with user data (`req.auth`)
5. **Controller execution** with authenticated request
6. **Response** sent to client

### Refresh Token Request Flow

1. **Request arrives** at refresh endpoint
2. **Refresh token middleware** extracts token from cookies
3. **Token verification** using HMAC secret
4. **Database validation** checks token existence
5. **Request augmentation** with user data
6. **Controller execution** with authenticated request
7. **Token rotation** creates new tokens
8. **Old token deletion** from database
9. **Response** with new tokens in cookies

## Security Features

### Token Security

- **RSA Asymmetric Encryption**: Access tokens use public/private key pairs
- **HMAC Symmetric Encryption**: Refresh tokens use shared secrets
- **Token Expiration**: Appropriate expiration times for different token types
- **Token Rotation**: Refresh tokens are rotated on each use
- **Database Validation**: Refresh tokens validated against database records

### Request Security

- **HTTP-Only Cookies**: Tokens stored in secure cookies
- **Bearer Token Support**: Authorization header support for APIs
- **Credential Requirements**: Configurable credential requirements
- **Error Logging**: Comprehensive error logging for security monitoring

## Configuration Requirements

### Environment Variables

- `REFRESH_TOKEN_SECRET`: Secret for refresh token HMAC signing

### File System Requirements

- `certs/public.pem`: RSA public key for access token verification
- `certs/private.pem`: RSA private key for access token signing

### Database Requirements

- RefreshTokens table for token persistence and revocation

## Error Handling

### Common Error Responses

- **401 Unauthorized**: Missing, invalid, or expired tokens
- **400 Bad Request**: Invalid request body validation
- **403 Forbidden**: Insufficient permissions
- **500 Internal Server Error**: System or database errors

### Error Logging

All middleware includes comprehensive error logging:

```typescript
logger.error('Error description', {
    error: errorMessage,
    additionalContext: data,
});
```

## Performance Considerations

### Token Verification

- **Public Key Caching**: Public key read once at startup
- **Database Indexing**: RefreshToken table indexed for fast lookups
- **Connection Pooling**: Database connections reused efficiently

### Memory Usage

- **Minimal State**: Middleware maintains minimal in-memory state
- **Efficient Parsing**: JWT parsing optimized for performance
- **Garbage Collection**: Proper cleanup of unused objects

## Testing

Middleware is tested via integration tests that:

- Test token validation scenarios
- Verify error handling
- Test request augmentation
- Validate security features
- Test edge cases and error conditions

## Future Middleware

The module is designed to accommodate additional middleware:

- `rateLimiter.ts`: API rate limiting
- `corsHandler.ts`: CORS configuration
- `requestLogger.ts`: Request/response logging
- `cacheMiddleware.ts`: Response caching
- `auditLogger.ts`: Security audit logging

Each new middleware should follow the established patterns for consistency and maintainability.
