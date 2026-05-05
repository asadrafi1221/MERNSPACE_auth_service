import { DataSource } from 'typeorm';
import { AppDataSource } from '../../config/data-source';
import app from '../../app';
import request from 'supertest';
import { truncateTables } from '../utils';
import { ITenantPayload } from '../../types';
import { Tenant } from '../../entity/Tenant';
import createJWKSMock from 'mock-jwks';
import { Roles } from '../../constants';

describe('POST /create/tenant', () => {
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

    async function callApi(payload: ITenantPayload) {
        const adminAccessToken = jwks.token({
            sub: '1',
            role: Roles.ADMIN,
        });

        const response = await request(app)
            .post('/tenants/create')
            .set('Cookie', [`accessToken=${adminAccessToken}`])
            .send(payload);
        return response;
    }

    async function asserData() {
        const payload: ITenantPayload = {
            name: 'Tenant Name ',
            adress: 'Tenant adress',
        };

        const response = await callApi(payload);
        return response;
    }

    describe('Given all fields', () => {
        it('should return 201 status code', async () => {
            const response = await asserData();
            expect(response.statusCode).toBe(201);
        });
        it('should store tenant in the databse', async () => {
            const response = await asserData();
            const tenantRepository = connection.getRepository(Tenant);
            const tenant = await tenantRepository.find();

            expect(response.statusCode).toBe(201);
            expect(tenant).toHaveLength(1);
        });
        it('should return 401 status if user not logged in', async () => {
            const payload: ITenantPayload = {
                name: 'Tenant Name ',
                adress: 'Tenant adress',
            };

            const response = await request(app)
                .post('/tenants/create')
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
                .post('/tenants/create')
                .set('Cookie', [`accessToken=${managerAccessToken}`])
                .send(payload);

            expect(response.statusCode).toBe(403);
        });
    });

    // describe('Given missing fields', () => {
    //     it('should return 400 status code if any field is missing', async () => {
    //         const tenantData = {
    //             name: 'Tenant Name',
    //             // missing 'address' field
    //         };

    //         //Act
    //         const response = await request(app)
    //             .post('/tenants/create')
    //             .send(tenantData);

    //         // Assert
    //         expect(response.statusCode).toBe(400);
    //     });
    // });
});
