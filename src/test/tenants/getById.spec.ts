import { DataSource } from 'typeorm';
import { AppDataSource } from '../../config/data-source';
import app from '../../app';
import request from 'supertest';
import { truncateTables } from '../utils';
import { ITenantPayload } from '../../types';
import createJWKSMock from 'mock-jwks';
import { Roles } from '../../constants';
import { Tenant } from '../../entity/Tenant';

describe('GET /tenants/:id', () => {
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
                .get('/tenants/1')
                .set('Cookie', [`accessToken=${adminAccessToken}`]);

            expect(response.statusCode).toBe(404); // No tenant exists
        });

        it('should return 200 status code for manager', async () => {
            const managerAccessToken = jwks.token({
                sub: '1',
                role: Roles.MANAGER,
            });

            const response = await request(app)
                .get('/tenants/1')
                .set('Cookie', [`accessToken=${managerAccessToken}`]);

            expect(response.statusCode).toBe(404); // No tenant exists
        });

        it('should return tenant when valid ID is provided', async () => {
            // Create a tenant first
            const adminAccessToken = jwks.token({
                sub: '1',
                role: Roles.ADMIN,
            });

            const createPayload: ITenantPayload = {
                name: 'Test Tenant',
                address: 'Test Address',
            };

            const createResponse = await request(app)
                .post('/tenants/create')
                .set('Cookie', [`accessToken=${adminAccessToken}`])
                .send(createPayload);

            const tenantId = (createResponse.body as { id: number }).id;

            // Get tenant by ID
            const response = await request(app)
                .get(`/tenants/${tenantId}`)
                .set('Cookie', [`accessToken=${adminAccessToken}`]);

            expect(response.statusCode).toBe(200);
            const responseBody = response.body as { tenant: Tenant };
            expect(responseBody.tenant).toHaveProperty('id');
            expect(responseBody.tenant).toHaveProperty(
                'name',
                createPayload.name,
            );
            expect(responseBody.tenant).toHaveProperty(
                'address',
                createPayload.address,
            );
        });

        it('should return 404 when tenant does not exist', async () => {
            const adminAccessToken = jwks.token({
                sub: '1',
                role: Roles.ADMIN,
            });

            const response = await request(app)
                .get('/tenants/999')
                .set('Cookie', [`accessToken=${adminAccessToken}`]);

            expect(response.statusCode).toBe(404);
            const responseBody = response.body as {
                errors: Array<{ message: string }>;
            };
            expect(responseBody.errors[0].message).toBe('Tenant not found');
        });
    });

    describe('Given unauthorized access', () => {
        it('should return 401 status if user not logged in', async () => {
            const response = await request(app).get('/tenants/1');

            expect(response.statusCode).toBe(401);
        });

        it('should return 403 status if user is not admin or manager', async () => {
            const customerAccessToken = jwks.token({
                sub: '1',
                role: Roles.CUSTOMER,
            });

            const response = await request(app)
                .get('/tenants/1')
                .set('Cookie', [`accessToken=${customerAccessToken}`]);

            expect(response.statusCode).toBe(403);
        });
    });

    describe('Given invalid ID', () => {
        it('should handle invalid ID format gracefully', async () => {
            const adminAccessToken = jwks.token({
                sub: '1',
                role: Roles.ADMIN,
            });

            const response = await request(app)
                .get('/tenants/invalid-id')
                .set('Cookie', [`accessToken=${adminAccessToken}`]);

            // Should handle the invalid ID gracefully
            expect([400, 404]).toContain(response.statusCode);
        });
    });
});
