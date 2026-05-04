import { DataSource } from 'typeorm';
import { AppDataSource } from '../../config/data-source';
import app from '../../app';
import request from 'supertest';
import { truncateTables } from '../utils';
import { ITenantPayload } from '../../types';

describe('POST /create/tenant', () => {
    let connection: DataSource;

    beforeAll(async () => {
        connection = await AppDataSource.initialize();
    });

    beforeEach(async () => {
        // Database truncate
        await truncateTables(connection);
    });

    afterAll(async () => {
        await connection.destroy();
    });

    async function callApi(payload: ITenantPayload) {
        const response = await request(app)
            .post('/tenants/create')
            .send(payload);
        return response;
    }

    describe('Given all fields', () => {
        it('should return 201 status code', async () => {
            const payload: ITenantPayload = {
                name: 'Tenant Name ',
                adress: 'Tenant adress',
            };

            const response = await callApi(payload);

            expect(response.statusCode).toBe(201);
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
