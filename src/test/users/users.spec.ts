import { DataSource } from 'typeorm';
import { AppDataSource } from '../../config/data-source';
import request from 'supertest';

import { truncateTables } from '../utils';
import app from '../../app';

import createJWKSMock from 'mock-jwks';
import { User } from '../../entity/User';
import { Roles } from '../../constants';

describe('GET /auth/self', () => {
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

    describe('Given all fields', () => {
        it('should return 200 status code', async () => {
            const accessToken = jwks.token({
                sub: '1',
                roles: Roles.CUSTOMER,
            });
            const response = await request(app)
                .get('/auth/self')
                .set('Cookie', [`accessToken=${accessToken}`])
                .send();
            expect(response.statusCode).toBe(200);
        });
        it('should return the user data', async () => {
            // register user
            const userData = {
                firstName: 'Rakesh',
                lastName: 'Kumar',
                email: 'rakesh@gmail.com',
                password: 'secret',
            };

            const userRepository = connection.getRepository(User);

            const data = await userRepository.save({
                ...userData,
                role: Roles.CUSTOMER,
            });
            // Generta etoken
            const accessToken = jwks.token({
                sub: String(data?.id),
                role: data?.role,
            });
            // add token to cookie

            const response = await request(app)
                .get('/auth/self')
                .set('Cookie', [`accessToken=${accessToken}`])
                .send();

            // assert
            // check if user id macthes with regsitser user
            expect((response.body as Record<string, string>).id).toBe(data?.id);
        });
        it('should return  user password', async () => {
            const userData = {
                firstName: 'Rakesh',
                lastName: 'Kumar',
                email: 'rakesh@gmail.com',
                password: 'secret',
            };

            const userRepository = connection.getRepository(User);

            const data = await userRepository.save({
                ...userData,
                role: Roles.CUSTOMER,
            });
            // Generta etoken
            const accessToken = jwks.token({
                sub: String(data?.id),
                role: data?.role,
            });
            // add token to cookie

            const response = await request(app)
                .get('/auth/self')
                .set('Cookie', [`accessToken=${accessToken}`])
                .send();

            // assert
            // check if user id macthes with regsitser user
            expect(response.body as Record<string, string>).not.toHaveProperty(
                'password',
            );
        });
        it('should return  401 status code if token does not exist', async () => {
            // add token to cookie

            const userData = {
                firstName: 'Rakesh',
                lastName: 'Kumar',
                email: 'rakesh@gmail.com',
                password: 'secret',
            };

            const userRepository = connection.getRepository(User);

            await userRepository.save({
                ...userData,
                role: Roles.CUSTOMER,
            });

            const response = await request(app).get('/auth/self').send();

            // assert
            // check if user id macthes with regsitser user
            expect(response.statusCode).toBe(401);
        });
    });

    describe('Given missing fields', () => {});
});
