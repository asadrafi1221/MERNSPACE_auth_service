import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { CONFIG } from '.';

export const AppDataSource = new DataSource({
    type: 'postgres',
    host: CONFIG.DB_HOST,
    port: Number(CONFIG.DB_PORT),
    username: CONFIG.DB_USERNAME,
    password: CONFIG.DB_PASSWORD,
    database: CONFIG.DB_NAME,

    synchronize: CONFIG.NODE_ENV === 'test' || CONFIG.NODE_ENV === 'dev',
    logging: false,
    entities: ['src/entity/*.ts'],
    migrations: ['src/migration/*.ts'],
    subscribers: [],
});
