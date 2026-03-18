import request from 'supertest';
import { calculateDiscount } from './src/utils';
import app from './src/app';

describe('App', () => {
    it('should return correct discount amount', () => {
        const discount = calculateDiscount(100, 10);
        expect(discount).toBe(90);
    });

    it('should return welcome message and 200 status', async () => {
        const resp = await request(app).get('/home');
        expect(resp.status).toBe(200);
        expect(resp.text).toBe('welcome to auth service');
    });
});
