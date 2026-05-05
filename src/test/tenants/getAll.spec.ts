import { DataSource } from 'typeorm';
import { AppDataSource } from '../../config/data-source';
import app from '../../app';
import request from 'supertest';
import { truncateTables } from '../utils';
import { ITenantPayload } from '../../types';
import createJWKSMock from 'mock-jwks';
import { Roles } from '../../constants';
import { Tenant } from '../../entity/Tenant';

describe('GET /tenants', () => {
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
                .get('/tenants')
                .set('Cookie', [`accessToken=${adminAccessToken}`]);

            expect(response.statusCode).toBe(200);
        });

        it('should return 200 status code for manager', async () => {
            const managerAccessToken = jwks.token({
                sub: '1',
                role: Roles.MANAGER,
            });

            const response = await request(app)
                .get('/tenants')
                .set('Cookie', [`accessToken=${managerAccessToken}`]);

            expect(response.statusCode).toBe(200);
        });

        it('should return empty array when no tenants exist', async () => {
            const adminAccessToken = jwks.token({
                sub: '1',
                role: Roles.ADMIN,
            });

            const response = await request(app)
                .get('/tenants')
                .set('Cookie', [`accessToken=${adminAccessToken}`]);

            expect(response.statusCode).toBe(200);
            expect((response.body as { tenants: Tenant[] }).tenants).toEqual(
                [],
            );
        });

        it('should return all tenants when tenants exist', async () => {
            // Create multiple tenants
            const adminAccessToken = jwks.token({
                sub: '1',
                role: Roles.ADMIN,
            });

            const tenants: ITenantPayload[] = [
                { name: 'Tenant 1', address: 'Address 1' },
                { name: 'Tenant 2', address: 'Address 2' },
                { name: 'Tenant 3', address: 'Address 3' },
            ];

            // Create tenants
            for (const tenant of tenants) {
                await request(app)
                    .post('/tenants/create')
                    .set('Cookie', [`accessToken=${adminAccessToken}`])
                    .send(tenant);
            }

            // Get all tenants
            const response = await request(app)
                .get('/tenants')
                .set('Cookie', [`accessToken=${adminAccessToken}`]);

            expect(response.statusCode).toBe(200);
            const responseBody = response.body as { tenants: Tenant[] };
            expect(responseBody.tenants).toHaveLength(3);
            expect(responseBody.tenants[0]).toHaveProperty('name');
            expect(responseBody.tenants[0]).toHaveProperty('address');
            expect(responseBody.tenants[0]).toHaveProperty('id');
        });
    });

    describe('Given unauthorized access', () => {
        it('should return 401 status if user not logged in', async () => {
            const response = await request(app).get('/tenants');

            expect(response.statusCode).toBe(401);
        });

        it('should return 403 status if user is not admin or manager', async () => {
            const customerAccessToken = jwks.token({
                sub: '1',
                role: Roles.CUSTOMER,
            });

            const response = await request(app)
                .get('/tenants')
                .set('Cookie', [`accessToken=${customerAccessToken}`]);

            expect(response.statusCode).toBe(403);
        });
    });
});
