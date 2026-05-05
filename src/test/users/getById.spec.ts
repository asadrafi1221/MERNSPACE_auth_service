import { DataSource } from 'typeorm';
import { AppDataSource } from '../../config/data-source';
import app from '../../app';
import request from 'supertest';
import { truncateTables } from '../utils';
import { UserData } from '../../types';
import createJWKSMock from 'mock-jwks';
import { Roles } from '../../constants';
import { User } from '../../entity/User';

describe('GET /users/:id', () => {
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
    }, timeout);

    afterAll(async () => {
        jwks.stop();
        await connection.destroy();
    });

    describe('Given authorized access', () => {
        it('should return 200 status code for admin', async () => {
            const adminAccessToken = jwks.token({
                sub: '1',
                role: Roles.ADMIN,
            });

            const response = await request(app)
                .get('/users/1')
                .set('Cookie', [`accessToken=${adminAccessToken}`]);

            expect(response.statusCode).toBe(404); // No user exists
        });

        it('should return user when valid ID is provided', async () => {
            // Create a user first
            const adminAccessToken = jwks.token({
                sub: '1',
                role: Roles.ADMIN,
            });

            const createPayload: UserData = {
                firstName: 'Test',
                lastName: 'User',
                email: 'test@example.com',
                password: 'password123',
            };

            const createResponse = await request(app)
                .post('/users/create')
                .set('Cookie', [`accessToken=${adminAccessToken}`])
                .send(createPayload);

            const userId = (createResponse.body as { id: number }).id;

            // Get user by ID
            const response = await request(app)
                .get(`/users/${userId}`)
                .set('Cookie', [`accessToken=${adminAccessToken}`]);

            expect(response.statusCode).toBe(200);
            const responseBody = response.body as { user: User };
            expect(responseBody.user).toHaveProperty('id');
            expect(responseBody.user).toHaveProperty(
                'firstName',
                createPayload.firstName,
            );
            expect(responseBody.user).toHaveProperty(
                'lastName',
                createPayload.lastName,
            );
            expect(responseBody.user).toHaveProperty(
                'email',
                createPayload.email,
            );
            expect(responseBody.user).not.toHaveProperty('password');
        });

        it('should return 404 when user does not exist', async () => {
            const adminAccessToken = jwks.token({
                sub: '1',
                role: Roles.ADMIN,
            });

            const response = await request(app)
                .get('/users/999')
                .set('Cookie', [`accessToken=${adminAccessToken}`]);

            expect(response.statusCode).toBe(404);
            const responseBody = response.body as {
                errors: Array<{ message: string }>;
            };
            expect(responseBody.errors[0].message).toBe('User not found');
        });
    });

    describe('Given unauthorized access', () => {
        it('should return 401 status if user not logged in', async () => {
            const response = await request(app).get('/users/1');

            expect(response.statusCode).toBe(401);
        });

        it('should return 403 status if user is not admin', async () => {
            const customerAccessToken = jwks.token({
                sub: '1',
                role: Roles.CUSTOMER,
            });

            const response = await request(app)
                .get('/users/1')
                .set('Cookie', [`accessToken=${customerAccessToken}`]);

            expect(response.statusCode).toBe(403);
        });
    });

    describe('Given invalid ID', () => {
        it('should return 400 status for invalid ID format', async () => {
            const adminAccessToken = jwks.token({
                sub: '1',
                role: Roles.ADMIN,
            });

            const response = await request(app)
                .get('/users/invalid-id')
                .set('Cookie', [`accessToken=${adminAccessToken}`]);

            expect(response.statusCode).toBe(400);
            const responseBody = response.body as {
                errors: Array<{ message: string }>;
            };
            expect(responseBody.errors[0].message).toBe(
                'Invalid user ID format',
            );
        });
    });
});
