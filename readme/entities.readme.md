# Entities Module Documentation

## Overview

The Entities module contains TypeORM entity definitions that represent database tables. Entities define the structure of data stored in the database and provide object-relational mapping capabilities.

## Available Entities

### User (`src/entity/User.ts`)

#### Purpose
Represents user accounts in the system with authentication and profile information.

#### Table Definition
```typescript
@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 255 })
  firstName!: string;

  @Column({ type: 'varchar', length: 255 })
  lastName!: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email!: string;

  @Column({ type: 'varchar', length: 255 })
  password!: string;

  @Column({
    type: 'enum',
    enum: Roles,
    default: Roles.CUSTOMER,
  })
  role!: Roles;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
```

#### Fields
- **id**: Primary key, auto-generated integer
- **firstName**: User's first name (max 255 characters)
- **lastName**: User's last name (max 255 characters)
- **email**: Unique email address (max 255 characters)
- **password**: Hashed password (max 255 characters)
- **role**: User role using enum values
- **createdAt**: Record creation timestamp
- **updatedAt**: Record last update timestamp

#### Relationships
- **One-to-Many**: Has many RefreshToken records
- **Implicit**: Referenced by RefreshToken.user

#### Role Enum
```typescript
export enum Roles {
  CUSTOMER = 'customer',
  ADMIN = 'admin',
}
```

#### Usage Example
```typescript
// Create user
const user = userRepository.create({
  firstName: 'John',
  lastName: 'Doe',
  email: 'john@example.com',
  password: 'hashedPassword',
  role: Roles.CUSTOMER,
});

// Find user
const user = await userRepository.findOne({
  where: { email: 'john@example.com' },
  relations: ['refreshTokens']
});
```

### RefreshToken (`src/entity/RefreshToken.ts`)

#### Purpose
Represents refresh tokens stored in the database for token revocation and rotation capabilities.

#### Table Definition
```typescript
@Entity()
export class RefreshToken {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'timestamp' })
  expiresAt!: Date;

  @ManyToOne(() => User)
  user!: User;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
```

#### Fields
- **id**: Primary key, auto-generated integer (used as JWT ID)
- **expiresAt**: Token expiration timestamp
- **user**: Foreign key relationship to User entity
- **createdAt**: Record creation timestamp
- **updatedAt**: Record last update timestamp

#### Relationships
- **Many-to-One**: Belongs to one User
- **Database Level**: Foreign key constraint on user_id

#### Usage Example
```typescript
// Create refresh token
const refreshToken = refreshTokenRepository.create({
  user: user,
  expiresAt: new Date(Date.now() + MS_IN_YEAR),
});

// Find refresh token
const token = await refreshTokenRepository.findOne({
  where: {
    id: Number(jti),
    user: { id: Number(sub) }
  },
  relations: ['user']
});

// Delete refresh token
await refreshTokenRepository.delete({ id: tokenId });
```

## Entity Patterns

### Base Entity Pattern
```typescript
@Entity()
export class BaseEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
```

### Enum Field Pattern
```typescript
@Column({
  type: 'enum',
  enum: Roles,
  default: Roles.CUSTOMER,
})
role!: Roles;
```

### Relationship Pattern
```typescript
// One-to-Many
@OneToMany(() => RefreshToken, token => token.user)
refreshTokens!: RefreshToken[];

// Many-to-One
@ManyToOne(() => User)
user!: User;
```

### Validation Pattern
```typescript
@Column({ type: 'varchar', length: 255, unique: true })
email!: string;

@Column({ type: 'varchar', length: 255, nullable: false })
firstName!: string;
```

## Database Schema

### Users Table
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  first_name VARCHAR(255) NOT NULL,
  last_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'customer',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Refresh Tokens Table
```sql
CREATE TABLE refresh_tokens (
  id SERIAL PRIMARY KEY,
  expires_at TIMESTAMP NOT NULL,
  user_id INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

## Indexes and Constraints

### Users Table Indexes
- **Primary Key**: `id` (auto-indexed)
- **Unique Index**: `email` (enforced by unique constraint)
- **Implicit Index**: `role` (for role-based queries)

### Refresh Tokens Table Indexes
- **Primary Key**: `id` (auto-indexed)
- **Foreign Key Index**: `user_id` (auto-created by foreign key)
- **Query Index**: `(id, user_id)` for token validation
- **Expiration Index**: `expires_at` for cleanup operations

## Data Integrity

### Constraints
- **Email Uniqueness**: Prevents duplicate email addresses
- **Foreign Key**: Ensures refresh tokens reference valid users
- **Not Null**: Required fields cannot be null
- **Enum Values**: Role field limited to predefined values

### Cascading Operations
- **Delete Cascade**: When user is deleted, associated refresh tokens are also deleted
- **Update Cascade**: Timestamp fields automatically updated

## Security Considerations

### Password Security
- **Hashed Storage**: Passwords stored as bcrypt hashes
- **No Plain Text**: Never store passwords in plain text
- **Field Length**: Sufficient length for hash storage

### Token Security
- **JWT ID Mapping**: Refresh token ID maps to database record
- **Expiration Tracking**: Explicit expiration timestamps
- **User Association**: Tokens tied to specific users

### Data Privacy
- **PII Protection**: Personal information properly secured
- **Access Control**: Database access controlled via repository pattern
- **Audit Trail**: Timestamp fields provide audit capabilities

## Performance Considerations

### Query Optimization
- **Index Usage**: Appropriate indexes for common queries
- **Relationship Loading**: Eager vs lazy loading based on use case
- **Connection Pooling**: Database connections efficiently managed

### Memory Usage
- **Entity Lifecycle**: Proper entity lifecycle management
- **Lazy Loading**: Relationships loaded only when needed
- **Connection Management**: Database connections properly closed

## Migration Strategy

### Initial Migration
```typescript
// Create users table
await queryRunner.createTable(
  new Table({
    name: 'users',
    columns: [
      { name: 'id', type: 'int', isPrimary: true, isGenerated: true },
      { name: 'firstName', type: 'varchar', length: '255' },
      { name: 'lastName', type: 'varchar', length: '255' },
      { name: 'email', type: 'varchar', length: '255', isUnique: true },
      { name: 'password', type: 'varchar', length: '255' },
      { name: 'role', type: 'enum', enum: Roles },
      { name: 'createdAt', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
      { name: 'updatedAt', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
    ],
  }),
  true
);
```

### Data Seeding
```typescript
// Seed admin user
const admin = userRepository.create({
  firstName: 'Admin',
  lastName: 'User',
  email: 'admin@example.com',
  password: hashedPassword,
  role: Roles.ADMIN,
});
await userRepository.save(admin);
```

## Testing

### Unit Testing
- **Entity Validation**: Test field constraints and validations
- **Relationship Testing**: Verify relationship mappings
- **Business Logic**: Test entity methods and computed properties

### Integration Testing
- **Database Operations**: Test CRUD operations
- **Data Integrity**: Verify constraint enforcement
- **Performance**: Test query performance with realistic data

## Future Entities

The module is designed to accommodate additional entities:
- `Profile`: Extended user profile information
- `Session`: User session management
- `AuditLog`: Audit trail for security events
- `Permission`: Role-based permissions
- `Setting`: User preferences and system settings

Each new entity should follow the established patterns for consistency and maintainability.
