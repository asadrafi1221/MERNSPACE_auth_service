import { DataSource } from 'typeorm';
import { AppDataSource } from '../../config/data-source';
import app from '../../app';
import request, { Response } from 'supertest';
import { truncateTables } from '../utils';
import { UserData } from '../../types';
import createJWKSMock from 'mock-jwks';
import { Roles } from '../../constants';
import { User } from '../../entity/User';

describe('DELETE /users/delete/:id', () => {
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

    describe('Given valid user ID', () => {
        it('should return 200 status code', async () => {
            // First create a user
            const createPayload: UserData = {
                firstName: 'Test',
                lastName: 'User',
                email: 'test@example.com',
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

            // Then delete it
            const deleteResponse: Response = await request(app)
                .delete(`/users/delete/${userId}`)
                .set('Cookie', [`accessToken=${adminAccessToken}`]);

            expect(deleteResponse.statusCode).toBe(200);
        });

        it('should delete user from database', async () => {
            // First create a user
            const createPayload: UserData = {
                firstName: 'Test',
                lastName: 'User',
                email: 'test@example.com',
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

            // Verify user exists
            const userRepository = connection.getRepository(User);
            let user = await userRepository.findOne({ where: { id: userId } });
            expect(user).toBeTruthy();

            // Then delete it
            const deleteResponse: Response = await request(app)
                .delete(`/users/delete/${userId}`)
                .set('Cookie', [`accessToken=${adminAccessToken}`]);

            expect(deleteResponse.statusCode).toBe(200);

            // Verify user is deleted
            user = await userRepository.findOne({ where: { id: userId } });
            expect(user).toBeFalsy();
        });
    });

    describe('Given unauthorized access', () => {
        it('should return 401 status if user not logged in', async () => {
            const response = await request(app).delete('/users/delete/1');

            expect(response.statusCode).toBe(401);
        });

        it('should return 403 status if user is not admin', async () => {
            const customerAccessToken = jwks.token({
                sub: '1',
                role: Roles.CUSTOMER,
            });

            const response = await request(app)
                .delete('/users/delete/1')
                .set('Cookie', [`accessToken=${customerAccessToken}`]);

            expect(response.statusCode).toBe(403);
        });
    });

    describe('Given invalid user ID', () => {
        it('should return 400 status for invalid ID format', async () => {
            const adminAccessToken = jwks.token({
                sub: '1',
                role: Roles.ADMIN,
            });

            const response = await request(app)
                .delete('/users/delete/invalid-id')
                .set('Cookie', [`accessToken=${adminAccessToken}`]);

            expect(response.statusCode).toBe(400);
            const responseBody = response.body as {
                errors: Array<{ message: string }>;
            };
            expect(responseBody.errors[0].message).toBe(
                'Invalid user ID format',
            );
        });

        it('should handle non-existent user gracefully', async () => {
            const adminAccessToken = jwks.token({
                sub: '1',
                role: Roles.ADMIN,
            });

            const response = await request(app)
                .delete('/users/delete/999')
                .set('Cookie', [`accessToken=${adminAccessToken}`]);

            expect(response.statusCode).toBe(404); // Service throws 404 for non-existent user
        });
    });
});
