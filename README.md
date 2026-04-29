# MERNSPACE_auth_service

## Recent Fixes

### Foreign Key Constraint Issue in Tests (April 29, 2026)

**Problem**: Test suite was failing with "QueryFailedError: cannot truncate a table referenced in a foreign key constraint" when trying to truncate tables during test setup.

**Root Cause**: The `truncateTables` function in `src/test/utils/index.ts` was attempting to truncate tables without respecting foreign key dependencies. When `RefreshToken` table (which has a foreign key to `User`) was truncated before the `User` table, PostgreSQL blocked the operation.

**Solution**: Replaced the sorting approach with a more robust solution using raw SQL with CASCADE:

```typescript
export const truncateTables = async (connection: DataSource) => {
    const entities = connection.entityMetadatas;

    // Disable foreign key constraints temporarily
    await connection.query('SET session_replication_role = replica;');

    // Truncate all tables in reverse order of dependencies
    const tableNames = entities.map((entity) => entity.tableName);

    for (const tableName of tableNames) {
        await connection.query(`TRUNCATE TABLE "${tableName}" CASCADE;`);
    }

    // Re-enable foreign key constraints
    await connection.query('SET session_replication_role = DEFAULT;');
};
```

**Impact**: This solution temporarily disables foreign key constraints, uses CASCADE to automatically handle dependent records, and then re-enables constraints. This completely eliminates foreign key constraint violations during test cleanup.

### RefreshToken Date Type Issue (April 29, 2026)

**Problem**: Registration tests were failing with 500 status codes due to type mismatch in RefreshToken creation.

**Root Cause**: The `expiresAt` field in RefreshToken entity was defined as `Date` type, but the AuthController was passing a number (`Date.now() + MS_IN_YEAR`) instead of a Date object.

**Solution**: Fixed the type mismatch by wrapping the timestamp in a Date constructor:

```typescript
const newRefreshToken = await refreshTokenRepository.save({
    user: user,
    expiresAt: new Date(Date.now() + MS_IN_YEAR), // Fixed: new Date() wrapper
});
```

**Impact**: This resolves the 500 status code errors and allows proper creation of refresh tokens during user registration.

## Project Overview

Authentication service for MERNSPACE application built with Node.js, TypeScript, and TypeORM.

## Features

- User registration and authentication
- JWT token management
- Refresh token implementation
- Role-based access control
- PostgreSQL database integration

## Tech Stack

- Node.js
- TypeScript
- TypeORM
- PostgreSQL
- Express.js
- Jest (for testing)
