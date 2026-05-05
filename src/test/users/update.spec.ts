import { DataSource } from 'typeorm';
import { AppDataSource } from '../../config/data-source';
import app from '../../app';
import request, { Response } from 'supertest';
import { truncateTables } from '../utils';
import { UserData } from '../../types';
import createJWKSMock from 'mock-jwks';
import { Roles } from '../../constants';
import { User } from '../../entity/User';
import { Tenant } from '../../entity/Tenant';

describe('PATCH /users/update/:id', () => {
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
        // Database truncate
        await truncateTables(connection);
    });

    afterAll(async () => {
        jwks.stop();
        await connection.destroy();
    });

    describe('Given valid fields', () => {
        it('should return 200 status code', async () => {
            // First create a user
            const createPayload: UserData = {
                firstName: 'John',
                lastName: 'Doe',
                email: 'john.doe@example.com',
                password: 'password123',
            };

            const adminAccessToken = jwks.token({
                sub: '1',
                role: Roles.ADMIN,
            });

            const createResponse: Response = await request(app)
                .post('/users/create')
                .set('Cookie', [`accessToken=${adminAccessToken}`])
                .send(createPayload);

            const userId = (createResponse.body as { id: number }).id;

            // Then update it
            const updatePayload = {
                firstName: 'Jane',
                lastName: 'Smith',
            };

            const updateResponse: Response = await request(app)
                .post(`/users/update/${userId}`)
                .set('Cookie', [`accessToken=${adminAccessToken}`])
                .send(updatePayload);

            expect(updateResponse.statusCode).toBe(200);
        });

        it('should update user in database', async () => {
            // First create a user
            const createPayload: UserData = {
                firstName: 'John',
                lastName: 'Doe',
                email: 'john.doe@example.com',
                password: 'password123',
            };

            const adminAccessToken = jwks.token({
                sub: '1',
                role: Roles.ADMIN,
            });

            const createResponse: Response = await request(app)
                .post('/users/create')
                .set('Cookie', [`accessToken=${adminAccessToken}`])
                .send(createPayload);

            const userId = (createResponse.body as { id: number }).id;

            // Then update it
            const updatePayload = {
                firstName: 'Jane',
                lastName: 'Smith',
                email: 'jane.smith@example.com',
            };

            const updateResponse: Response = await request(app)
                .post(`/users/update/${userId}`)
                .set('Cookie', [`accessToken=${adminAccessToken}`])
                .send(updatePayload);

            expect(updateResponse.statusCode).toBe(200);

            const userRepository = connection.getRepository(User);
            const user = await userRepository.findOne({
                where: { id: userId },
            });

            expect(user).toBeTruthy();
            expect(user!.firstName).toBe(updatePayload.firstName);
            expect(user!.lastName).toBe(updatePayload.lastName);
            expect(user!.email).toBe(updatePayload.email);
        });

        it('should update user with tenantId and role', async () => {
            // First create a user
            const createPayload: UserData = {
                firstName: 'John',
                lastName: 'Doe',
                email: 'john.doe@example.com',
                password: 'password123',
            };

            const adminAccessToken = jwks.token({
                sub: '1',
                role: Roles.ADMIN,
            });

            const createResponse: Response = await request(app)
                .post('/users/create')
                .set('Cookie', [`accessToken=${adminAccessToken}`])
                .send(createPayload);

            const userId = (createResponse.body as { id: number }).id;

            // Create a tenant for testing
            const tenantRepository = connection.getRepository(Tenant);
            const tenant = await tenantRepository.save({
                name: 'Test Tenant',
                address: 'Test Address',
            });

            // Then update user with tenantId and role
            const updatePayload = {
                role: 'manager',
                tenantId: tenant.id,
            };

            const updateResponse: Response = await request(app)
                .post(`/users/update/${userId}`)
                .set('Cookie', [`accessToken=${adminAccessToken}`])
                .send(updatePayload);

            expect(updateResponse.statusCode).toBe(200);

            const userRepository = connection.getRepository(User);
            const user = await userRepository.findOne({
                where: { id: userId },
                relations: ['tenant'],
            });

            expect(user).toBeTruthy();
            expect(user!.role).toBe(updatePayload.role);
            expect(user!.tenant?.id).toBe(tenant.id);
            expect(user!.tenant?.name).toBe(tenant.name);
        });

        it('should update user and remove tenant association', async () => {
            // First create a tenant and user with tenant
            const tenantRepository = connection.getRepository(Tenant);
            const tenant = await tenantRepository.save({
                name: 'Test Tenant',
                address: 'Test Address',
            });

            const createPayload: UserData = {
                firstName: 'John',
                lastName: 'Doe',
                email: 'john.doe@example.com',
                password: 'password123',
                tenantId: tenant.id,
            };

            const adminAccessToken = jwks.token({
                sub: '1',
                role: Roles.ADMIN,
            });

            const createResponse: Response = await request(app)
                .post('/users/create')
                .set('Cookie', [`accessToken=${adminAccessToken}`])
                .send(createPayload);

            const userId = (createResponse.body as { id: number }).id;

            // Then update user to remove tenant
            const updatePayload = {
                tenantId: null,
            };

            const updateResponse: Response = await request(app)
                .post(`/users/update/${userId}`)
                .set('Cookie', [`accessToken=${adminAccessToken}`])
                .send(updatePayload);

            expect(updateResponse.statusCode).toBe(200);

            const userRepository = connection.getRepository(User);
            const user = await userRepository.findOne({
                where: { id: userId },
                relations: ['tenant'],
            });

            expect(user).toBeTruthy();
            expect(user!.tenant).toBeNull();
        });
    });

    describe('Given unauthorized access', () => {
        it('should return 401 status if user not logged in', async () => {
            const payload = {
                firstName: 'Jane',
                lastName: 'Smith',
            };

            const response = await request(app)
                .post('/users/update/1')
                .send(payload);

            expect(response.statusCode).toBe(401);
        });

        it('should return 403 status if user is not admin', async () => {
            const managerAccessToken = jwks.token({
                sub: '1',
                role: Roles.MANAGER,
            });

            const payload = {
                firstName: 'Jane',
                lastName: 'Smith',
            };

            const response = await request(app)
                .post('/users/update/1')
                .set('Cookie', [`accessToken=${managerAccessToken}`])
                .send(payload);

            expect(response.statusCode).toBe(403);
        });
    });

    describe('Given invalid data', () => {
        it('should return 400 status if any wrong fields are passed', async () => {
            const adminAccessToken = jwks.token({
                sub: '1',
                role: Roles.ADMIN,
            });

            const updatePayload = {
                invalidField: 'Some value',
            };

            const response = await request(app)
                .post('/users/update/1')
                .set('Cookie', [`accessToken=${adminAccessToken}`])
                .send(updatePayload);

            expect(response.statusCode).toBe(400);
        });

        it('should return 400 status for invalid ID format', async () => {
            const adminAccessToken = jwks.token({
                sub: '1',
                role: Roles.ADMIN,
            });

            const updatePayload = {
                firstName: 'Jane',
            };

            const response = await request(app)
                .post('/users/update/invalid-id')
                .set('Cookie', [`accessToken=${adminAccessToken}`])
                .send(updatePayload);

            expect(response.statusCode).toBe(400);
        });
    });
});
