import { DataSource } from 'typeorm';
import { AppDataSource } from '../../config/data-source';
import app from '../../app';
import request from 'supertest';
import { truncateTables } from '../utils';
import { User } from '../../entity/User';
import { Roles } from '../../constants';

describe('POST /auth/register', () => {
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

    describe('Given all fields', () => {
        it('should return 201 status code', async () => {
            // Arrange
            const userData = {
                firstName: 'Rakesh',
                lastName: 'Kumar',
                email: 'rakesh@gmail.com',
                password: 'secret',
            };

            //Act
            const response = await request(app)
                .post('/auth/register')
                .send(userData);

            //Assert
            expect(response.statusCode).toBe(201);
        });
        it('should return valid json response', async () => {
            // Arrange
            const userData = {
                firstName: 'Rakesh',
                lastName: 'Kumar',
                email: 'rakesh@gmail.com',
                password: 'secret',
            };

            //Act
            const response = await request(app)
                .post('/auth/register')
                .send(userData);

            //Assert
            expect(response.statusCode).toBe(201);
        });
        it('should persist the user in the database', async () => {
            // Arrange
            const userData = {
                firstName: 'Rakesh',
                lastName: 'Kumar',
                email: 'rakesh@gmail.com',
                password: 'secret',
            };

            //Act
            const response = await request(app)
                .post('/auth/register')
                .send(userData);
            const userRepository = connection.getRepository(User);
            const users = await userRepository.find();

            //Assert
            expect(response.statusCode).toBe(201);
            expect(users).toHaveLength(1);
            expect(users[0].firstName).toBe(userData.firstName);
            expect(users[0].lastName).toBe(userData.lastName);

            expect(users[0].email).toBe(userData.email);

            expect(users[0].id).toBeDefined();
        });
        it('should return id of the created user', async () => {
            const userData = {
                firstName: 'Rakesh',
                lastName: 'Kumar',
                email: 'rakesh@gmail.com',
                password: 'secret',
            };

            //Act
            const response = await request(app)
                .post('/auth/register')
                .send(userData);
            const userRepository = connection.getRepository(User);
            const users = await userRepository.find();

            //Assert
            expect(response.statusCode).toBe(201);
            expect(users).toHaveLength(1);
            expect(users[0].firstName).toBe(userData.firstName);
            expect(users[0].lastName).toBe(userData.lastName);

            expect(users[0].email).toBe(userData.email);

            expect(users[0].id).toBeDefined();

            expect(response.body).toHaveProperty('id');
        });
        it('should assign customer role', async () => {
            const userData = {
                firstName: 'Rakesh',
                lastName: 'Kumar',
                email: 'rakesh@gmail.com',
                password: 'secret',
            };

            //Act
            await request(app).post('/auth/register').send(userData);
            const userRepository = connection.getRepository(User);
            const users = await userRepository.find();

            //Assert

            expect(users[0]).toHaveProperty('role');
            expect(users[0].role).toBe(Roles.CUSTOMER);
        });
        it('should store the hashpassword in the database', async () => {
            const userData = {
                firstName: 'Rakesh',
                lastName: 'Kumar',
                email: 'rakesh@gmail.com',
                password: 'secret',
            };

            //Act
            await request(app).post('/auth/register').send(userData);

            // Assert
            const usersRepository = AppDataSource.getRepository(User);
            const users = await usersRepository.find();

            expect(users[0]).toHaveProperty('password');
            expect(users[0].password).not.toBe(userData?.password);
        });
        it('should return 400 status code if email already exist ', async () => {
            const userData = {
                firstName: 'Rakesh',
                lastName: 'Kumar',
                email: 'rakesh@gmail.com',
                password: 'secret',
            };

            //Act

            const usersRepository = connection.getRepository(User);
            await usersRepository.save({
                ...userData,
                role: Roles.CUSTOMER,
            });

            const response = await request(app)
                .post('/auth/register')
                .send(userData);

            const users = await usersRepository.find();

            // Assert
            expect(response.statusCode).toBe(400);
            expect(users).toHaveLength(1);
        });
    });

    describe('Given missing fields', () => {
        it('should return 400 status code if any field is missing', async () => {
            const userData = {
                lastName: 'Kumar',
                email: 'rakesh@gmail.com',
                password: 'secret',
            };

            //Act
            const response = await request(app)
                .post('/auth/register')
                .send(userData);

            // Assert
            expect(response.statusCode).toBe(400);
        });
    });
});
