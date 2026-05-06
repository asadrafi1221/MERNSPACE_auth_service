import { DataSource } from 'typeorm';
import { AppDataSource } from '../../config/data-source';
import app from '../../app';
import request, { Response } from 'supertest';
import { truncateTables } from '../utils';
import { ITenantPayload } from '../../types';
import createJWKSMock from 'mock-jwks';
import { Roles } from '../../constants';
import { Tenant } from '../../entity/Tenant';

describe('DELETE /tenant/delete', () => {
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

    describe('Given valid tenant ID', () => {
        it('should return 200 status code', async () => {
            // First create a tenant
            const createPayload: ITenantPayload = {
                name: 'Test Tenant',
                address: 'Test Address',
            };

            const adminAccessToken = jwks.token({
                sub: '1',
                role: Roles.ADMIN,
            });

            const createResponse: Response = await request(app)
                .post('/tenants/create')
                .set('Cookie', [`accessToken=${adminAccessToken}`])
                .send(createPayload);

            const tenantId: number = (createResponse.body as { id: number }).id;

            // Then delete it
            const deleteResponse: Response = await request(app)
                .delete(`/tenants/delete/${tenantId}`)
                .set('Cookie', [`accessToken=${adminAccessToken}`]);

            expect(deleteResponse.statusCode).toBe(200);
        });

        it('should delete tenant from database', async () => {
            // First create a tenant
            const createPayload: ITenantPayload = {
                name: 'Test Tenant',
                address: 'Test Address',
            };

            const adminAccessToken = jwks.token({
                sub: '1',
                role: Roles.ADMIN,
            });

            const createResponse: Response = await request(app)
                .post('/tenants/create')
                .set('Cookie', [`accessToken=${adminAccessToken}`])
                .send(createPayload);

            const tenantId: number = (createResponse.body as { id: number }).id;

            // Verify tenant exists
            const tenantRepository = connection.getRepository(Tenant);
            let tenant = await tenantRepository.findOne({
                where: { id: tenantId },
            });
            expect(tenant).toBeTruthy();

            // Then delete it
            const deleteResponse: Response = await request(app)
                .delete(`/tenants/delete/${tenantId}`)
                .set('Cookie', [`accessToken=${adminAccessToken}`]);

            expect(deleteResponse.statusCode).toBe(200);

            // Verify tenant is deleted
            tenant = await tenantRepository.findOne({
                where: { id: tenantId },
            });
            expect(tenant).toBeFalsy();
        });
    });

    describe('Given unauthorized access', () => {
        it('should return 401 status if user not logged in', async () => {
            const response = await request(app).delete('/tenants/delete/1');

            expect(response.statusCode).toBe(401);
        });

        it('should return 403 status if user is not admin', async () => {
            const managerAccessToken = jwks.token({
                sub: '1',
                role: Roles.MANAGER,
            });

            const response = await request(app)
                .delete('/tenants/delete/1')
                .set('Cookie', [`accessToken=${managerAccessToken}`]);

            expect(response.statusCode).toBe(403);
        });
    });

    describe('Given invalid tenant ID', () => {
        it('should handle non-existent tenant gracefully', async () => {
            const adminAccessToken = jwks.token({
                sub: '1',
                role: Roles.ADMIN,
            });

            const response = await request(app)
                .delete('/tenants/delete/999')
                .set('Cookie', [`accessToken=${adminAccessToken}`]);

            expect(response.statusCode).toBe(200);
        });
    });
});
