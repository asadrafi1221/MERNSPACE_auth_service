import { DataSource } from 'typeorm';
import { AppDataSource } from '../../config/data-source';
import app from '../../app';
import request, { Response } from 'supertest';
import { truncateTables } from '../utils';
import { ITenantPayload } from '../../types';
import createJWKSMock from 'mock-jwks';
import { Roles } from '../../constants';
import { Tenant } from '../../entity/Tenant';

describe('PATCH /tenant/update', () => {
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
            // First create a tenant
            const createPayload: ITenantPayload = {
                name: 'Original Name',
                adress: 'Original Address',
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

            // Then update it
            const updatePayload: ITenantPayload = {
                name: 'See bro',
                adress: 'Make this',
            };

            const updateResponse: Response = await request(app)
                .post(`/tenants/update/${tenantId}`)
                .set('Cookie', [`accessToken=${adminAccessToken}`])
                .send(updatePayload);

            expect(updateResponse.statusCode).toBe(200);
        });
        it('should return 401 status if user not logged in', async () => {
            const payload: ITenantPayload = {
                name: 'Tenant Name ',
                adress: 'Tenant adress',
            };

            const response = await request(app)
                .post('/tenants/update/1')
                .send(payload);

            expect(response.statusCode).toBe(401);
        });
        it('should return 403 status if user is not manager', async () => {
            const managerAccessToken = jwks.token({
                sub: '1',
                role: Roles.MANAGER,
            });

            const payload: ITenantPayload = {
                name: 'Tenant Name ',
                adress: 'Tenant adress',
            };

            const response = await request(app)
                .post('/tenants/update/1')
                .set('Cookie', [`accessToken=${managerAccessToken}`])
                .send(payload);

            expect(response.statusCode).toBe(403);
        });
        it('should update tenant in the databse', async () => {
            // First create a tenant
            const createPayload: ITenantPayload = {
                name: 'Original Name',
                adress: 'Original Address',
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

            // Then update it
            const updatePayload: ITenantPayload = {
                name: 'See bro',
                adress: 'Make this',
            };

            const updateResponse: Response = await request(app)
                .post(`/tenants/update/${tenantId}`)
                .set('Cookie', [`accessToken=${adminAccessToken}`])
                .send(updatePayload);

            expect(updateResponse.statusCode).toBe(200);

            const tenantRepository = connection.getRepository(Tenant);
            const tenant: Tenant | null = await tenantRepository.findOne({
                where: { id: tenantId },
            });

            expect(tenant).toBeTruthy();
            expect(tenant!.name).toBe(updatePayload.name);
            expect(tenant!.adress).toBe(updatePayload.adress);
        });
    });

    describe('Given wrong fields', () => {
        it('should return 400 status code if any wrong fields are passed', async () => {
            const createPayload: ITenantPayload = {
                name: 'Original Name',
                adress: 'Original Address',
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

            // Then update it
            const updatePayload = {
                ishaq: 'See bro',
                adress: 'Make this',
            };

            const updateResponse: Response = await request(app)
                .post(`/tenants/update/${tenantId}`)
                .set('Cookie', [`accessToken=${adminAccessToken}`])
                .send(updatePayload);

            expect(updateResponse.statusCode).toBe(400);
        });
    });
});
