import { DataSource } from 'typeorm';
import { AppDataSource } from '../../config/data-source';
import app from '../../app';
import request from 'supertest';
import { truncateTables } from '../utils';
import { UserData } from '../../types';
import createJWKSMock from 'mock-jwks';
import { Roles } from '../../constants';
import { User } from '../../entity/User';

describe('GET /users', () => {
    let connection: DataSource;
    let jwks: ReturnType<typeof createJWKSMock>;

    beforeAll(async () => {
        jwks = createJWKSMock('http://localhost:4500');
        connection = await AppDataSource.initialize();
    });

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
            expect((response.body as { users: User[] }).users).toEqual([]);
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
            const responseBody = response.body as { users: User[] };
            expect(responseBody.users).toHaveLength(3);
            expect(responseBody.users[0]).toHaveProperty('firstName');
            expect(responseBody.users[0]).toHaveProperty('lastName');
            expect(responseBody.users[0]).toHaveProperty('email');
            expect(responseBody.users[0]).toHaveProperty('id');
            expect(responseBody.users[0]).not.toHaveProperty('password'); // Password should be excluded
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
});
