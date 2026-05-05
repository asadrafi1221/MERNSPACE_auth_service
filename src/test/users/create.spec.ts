import { DataSource } from 'typeorm';
import { AppDataSource } from '../../config/data-source';
import app from '../../app';
import request from 'supertest';
import { truncateTables } from '../utils';
import { User } from '../../entity/User';
import { Tenant } from '../../entity/Tenant';
import { Roles } from '../../constants';
import createJWKSMock from 'mock-jwks';

describe('POST /users/create', () => {
    let connection: DataSource;
    let jwks: ReturnType<typeof createJWKSMock>;
    const isCI = process.env.CI === 'true';
    const timeout = isCI ? 60000 : undefined;

    beforeAll(async () => {
        jwks = createJWKSMock('http://localhost:4500');
        connection = await AppDataSource.initialize();
    }, timeout);

    beforeEach(async () => {
        jwks.start();
        await truncateTables(connection);
    });

    afterAll(async () => {
        jwks.stop();
        await connection.destroy();
    });

    describe('Given all required fields', () => {
        it('should return 201 status code', async () => {
            const userData = {
                firstName: 'John',
                lastName: 'Doe',
                email: 'john.doe@example.com',
                password: 'password123',
            };

            const accessToken = jwks.token({
                sub: '1',
                role: Roles.ADMIN,
            });

            const response = await request(app)
                .post('/users/create')
                .set('Cookie', [`accessToken=${accessToken}`])
                .send(userData);

            expect(response.statusCode).toBe(201);
        });

        it('should create user with tenantId and role', async () => {
            const tenantRepository = connection.getRepository(Tenant);
            const tenant = await tenantRepository.save({
                name: 'Test Tenant',
                address: 'Test Address',
            });

            const userData = {
                firstName: 'Jane',
                lastName: 'Smith',
                email: 'jane.smith@example.com',
                password: 'password123',
                tenantId: tenant.id,
                role: 'manager',
            };

            const accessToken = jwks.token({
                sub: '1',
                role: Roles.ADMIN,
            });

            const response = await request(app)
                .post('/users/create')
                .set('Cookie', [`accessToken=${accessToken}`])
                .send(userData);

            expect(response.statusCode).toBe(201);

            const userRepository = connection.getRepository(User);
            const users = await userRepository.find({ relations: ['tenant'] });

            expect(users).toHaveLength(1);
            expect(users[0].firstName).toBe(userData.firstName);
            expect(users[0].lastName).toBe(userData.lastName);
            expect(users[0].email).toBe(userData.email);
            expect(users[0].role).toBe(userData.role);
            expect(users[0].tenant?.id).toBe(tenant.id);
            expect(users[0].tenant?.name).toBe(tenant.name);
        });

        it('should create user without tenantId and role (defaults)', async () => {
            const userData = {
                firstName: 'Bob',
                lastName: 'Wilson',
                email: 'bob.wilson@example.com',
                password: 'password123',
            };

            const accessToken = jwks.token({
                sub: '1',
                role: Roles.ADMIN,
            });

            const response = await request(app)
                .post('/users/create')
                .set('Cookie', [`accessToken=${accessToken}`])
                .send(userData);

            expect(response.statusCode).toBe(201);

            const userRepository = connection.getRepository(User);
            const users = await userRepository.find();

            expect(users).toHaveLength(1);
            expect(users[0].firstName).toBe(userData.firstName);
            expect(users[0].lastName).toBe(userData.lastName);
            expect(users[0].email).toBe(userData.email);
            expect(users[0].role).toBe(Roles.CUSTOMER);
        });

        it('should return 400 for invalid tenantId', async () => {
            const userData = {
                firstName: 'Invalid',
                lastName: 'Tenant',
                email: 'invalid.tenant@example.com',
                password: 'password123',
                tenantId: -1,
            };

            const accessToken = jwks.token({
                sub: '1',
                role: Roles.ADMIN,
            });

            const response = await request(app)
                .post('/users/create')
                .set('Cookie', [`accessToken=${accessToken}`])
                .send(userData);

            expect(response.statusCode).toBe(400);
        });

        it('should return 400 for invalid role', async () => {
            const userData = {
                firstName: 'Invalid',
                lastName: 'Role',
                email: 'invalid.role@example.com',
                password: 'password123',
                role: 'invalid_role',
            };

            const accessToken = jwks.token({
                sub: '1',
                role: Roles.ADMIN,
            });

            const response = await request(app)
                .post('/users/create')
                .set('Cookie', [`accessToken=${accessToken}`])
                .send(userData);

            expect(response.statusCode).toBe(400);
        });
    });

    describe('Authorization', () => {
        it('should return 401 for unauthenticated request', async () => {
            const userData = {
                firstName: 'Unauthorized',
                lastName: 'User',
                email: 'unauthorized@example.com',
                password: 'password123',
            };

            const response = await request(app)
                .post('/users/create')
                .send(userData);

            expect(response.statusCode).toBe(401);
        });

        it('should return 403 for non-admin user', async () => {
            const userData = {
                firstName: 'Forbidden',
                lastName: 'User',
                email: 'forbidden@example.com',
                password: 'password123',
            };

            const accessToken = jwks.token({
                sub: '1',
                role: Roles.CUSTOMER,
            });

            const response = await request(app)
                .post('/users/create')
                .set('Cookie', [`accessToken=${accessToken}`])
                .send(userData);

            expect(response.statusCode).toBe(403);
        });
    });
});
