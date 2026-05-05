import { DataSource } from 'typeorm';
import { AppDataSource } from '../../config/data-source';
import app from '../../app';
import request from 'supertest';
import { truncateTables } from '../utils';
import { UserData } from '../../types';
import createJWKSMock from 'mock-jwks';
import { Roles } from '../../constants';

interface UserGetResponseType {
    statusCode: number;
    body: {
        users: Array<{
            id: number;
            firstName: string;
            lastName: string;
            email: string;
            role: string;
            tenant?: {
                id: number;
                name: string;
                address: string;
            };
        }>;
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
            hasNext: boolean;
            hasPrev: boolean;
        };
    };
}
describe('GET /users', () => {
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

    describe('Given authorized access', () => {
        it('should return 200 status code for admin', async () => {
            const adminAccessToken = jwks.token({
                sub: '1',
                role: Roles.ADMIN,
            });

            const response = await request(app)
                .get('/users')
                .set('Cookie', [`accessToken=${adminAccessToken}`]);

            expect(response.statusCode).toBe(200);
        });

        it('should return empty array when no users exist', async () => {
            const adminAccessToken = jwks.token({
                sub: '1',
                role: Roles.ADMIN,
            });

            const response = await request(app)
                .get('/users')
                .set('Cookie', [`accessToken=${adminAccessToken}`]);

            expect(response.statusCode).toBe(200);
            expect(response.body as UserGetResponseType['body']).toHaveProperty(
                'users',
            );
            expect(response.body as UserGetResponseType['body']).toHaveProperty(
                'pagination',
            );
            expect(
                (response.body as UserGetResponseType['body']).users,
            ).toEqual([]);
            expect(
                (response.body as UserGetResponseType['body']).pagination.page,
            ).toBe(1);
            expect(
                (response.body as UserGetResponseType['body']).pagination.limit,
            ).toBe(10);
            expect(
                (response.body as UserGetResponseType['body']).pagination.total,
            ).toBe(0);
        });

        it('should return all users when users exist', async () => {
            // Create multiple users
            const adminAccessToken = jwks.token({
                sub: '1',
                role: Roles.ADMIN,
            });

            const users: UserData[] = [
                {
                    firstName: 'User 1',
                    lastName: 'Test',
                    email: 'user1@test.com',
                    password: 'password123',
                },
                {
                    firstName: 'User 2',
                    lastName: 'Test',
                    email: 'user2@test.com',
                    password: 'password123',
                },
                {
                    firstName: 'User 3',
                    lastName: 'Test',
                    email: 'user3@test.com',
                    password: 'password123',
                },
            ];

            // Create users
            for (const user of users) {
                await request(app)
                    .post('/users/create')
                    .set('Cookie', [`accessToken=${adminAccessToken}`])
                    .send(user);
            }

            // Get all users
            const response = await request(app)
                .get('/users')
                .set('Cookie', [`accessToken=${adminAccessToken}`]);

            expect(response.statusCode).toBe(200);
            const responseBody = response.body as UserGetResponseType['body'];
            expect(responseBody).toHaveProperty('users');
            expect(responseBody).toHaveProperty('pagination');
            expect(responseBody.users).toHaveLength(3);
            expect(responseBody.users[0]).toHaveProperty('firstName');
            expect(responseBody.users[0]).toHaveProperty('lastName');
            expect(responseBody.users[0]).toHaveProperty('email');
            expect(responseBody.users[0]).toHaveProperty('id');
            expect(responseBody.users[0]).not.toHaveProperty('password'); // Password should be excluded
            expect(responseBody.pagination.total).toBe(3);
            expect(responseBody.pagination.page).toBe(1);
            expect(responseBody.pagination.limit).toBe(10);
        });
    });

    describe('Given unauthorized access', () => {
        it('should return 401 status if user not logged in', async () => {
            const response = await request(app).get('/users');

            expect(response.statusCode).toBe(401);
        });

        it('should return 403 status if user is not admin', async () => {
            const customerAccessToken = jwks.token({
                sub: '1',
                role: Roles.CUSTOMER,
            });

            const response = await request(app)
                .get('/users')
                .set('Cookie', [`accessToken=${customerAccessToken}`]);

            expect(response.statusCode).toBe(403);
        });

        it('should return 403 status for manager role', async () => {
            const managerAccessToken = jwks.token({
                sub: '1',
                role: Roles.MANAGER,
            });

            const response = await request(app)
                .get('/users')
                .set('Cookie', [`accessToken=${managerAccessToken}`]);

            expect(response.statusCode).toBe(403);
        });
    });

    describe('Given pagination parameters', () => {
        it('should return paginated results with limit', async () => {
            const adminAccessToken = jwks.token({
                sub: '1',
                role: Roles.ADMIN,
            });

            // Create 5 users
            for (let i = 1; i <= 5; i++) {
                await request(app)
                    .post('/users/create')
                    .set('Cookie', [`accessToken=${adminAccessToken}`])
                    .send({
                        firstName: `User ${i}`,
                        lastName: 'Test',
                        email: `user${i}@test.com`,
                        password: 'password123',
                    });
            }

            // Get first page with limit 2
            const response = await request(app)
                .get('/users?page=1&limit=2')
                .set('Cookie', [`accessToken=${adminAccessToken}`]);

            expect(response.statusCode).toBe(200);
            const responseBody = response.body as UserGetResponseType['body'];
            expect(responseBody.users).toHaveLength(2);
            expect(responseBody.pagination.page).toBe(1);
            expect(responseBody.pagination.limit).toBe(2);
            expect(responseBody.pagination.total).toBe(5);
            expect(responseBody.pagination.totalPages).toBe(3);
            expect(responseBody.pagination.hasNext).toBe(true);
            expect(responseBody.pagination.hasPrev).toBe(false);
        });

        it('should return second page of results', async () => {
            const adminAccessToken = jwks.token({
                sub: '1',
                role: Roles.ADMIN,
            });

            // Create 5 users
            for (let i = 1; i <= 5; i++) {
                await request(app)
                    .post('/users/create')
                    .set('Cookie', [`accessToken=${adminAccessToken}`])
                    .send({
                        firstName: `User ${i}`,
                        lastName: 'Test',
                        email: `user${i}@test.com`,
                        password: 'password123',
                    });
            }

            // Get second page with limit 2
            const response = await request(app)
                .get('/users?page=2&limit=2')
                .set('Cookie', [`accessToken=${adminAccessToken}`]);

            expect(response.statusCode).toBe(200);
            const responseBody = response.body as UserGetResponseType['body'];
            expect(responseBody.users).toHaveLength(2);
            expect(responseBody.pagination.page).toBe(2);
            expect(responseBody.pagination.limit).toBe(2);
            expect(responseBody.pagination.total).toBe(5);
            expect(responseBody.pagination.totalPages).toBe(3);
            expect(responseBody.pagination.hasNext).toBe(true);
            expect(responseBody.pagination.hasPrev).toBe(true);
        });

        it('should return search results', async () => {
            const adminAccessToken = jwks.token({
                sub: '1',
                role: Roles.ADMIN,
            });

            // Create users with specific names
            await request(app)
                .post('/users/create')
                .set('Cookie', [`accessToken=${adminAccessToken}`])
                .send({
                    firstName: 'John',
                    lastName: 'Doe',
                    email: 'john@test.com',
                    password: 'password123',
                });

            await request(app)
                .post('/users/create')
                .set('Cookie', [`accessToken=${adminAccessToken}`])
                .send({
                    firstName: 'Jane',
                    lastName: 'Smith',
                    email: 'jane@test.com',
                    password: 'password123',
                });

            // Search for "John"
            const response = await request(app)
                .get('/users?search=John')
                .set('Cookie', [`accessToken=${adminAccessToken}`]);

            expect(response.statusCode).toBe(200);
            const responseBody = response.body as UserGetResponseType['body'];
            expect(responseBody.users).toHaveLength(1);
            expect(responseBody.users[0].firstName).toBe('John');
            expect(responseBody.pagination.total).toBe(1);
        });

        it('should validate pagination parameters', async () => {
            const adminAccessToken = jwks.token({
                sub: '1',
                role: Roles.ADMIN,
            });

            // Test invalid page
            const response = await request(app)
                .get('/users?page=0')
                .set('Cookie', [`accessToken=${adminAccessToken}`]);

            expect(response.statusCode).toBe(400);

            // Test invalid limit
            const response2 = await request(app)
                .get('/users?limit=0')
                .set('Cookie', [`accessToken=${adminAccessToken}`]);

            expect(response2.statusCode).toBe(400);

            // Test limit too high
            const response3 = await request(app)
                .get('/users?limit=101')
                .set('Cookie', [`accessToken=${adminAccessToken}`]);

            expect(response3.statusCode).toBe(400);
        });
    });
});
