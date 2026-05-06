/* eslint-disable @typescript-eslint/no-unused-vars */
import { DataSource, Repository } from 'typeorm';
import { Tenant } from '../../entity/Tenant';

export const truncateTables = async (connection: DataSource) => {
    const entities = connection.entityMetadatas;

    // Disable foreign key constraints temporarily
    await connection.query('SET session_replication_role = replica;');

    // Truncate all tables in reverse order of dependencies
    const tableNames = entities.map((entity) => entity.tableName);

    for (const tableName of tableNames) {
        await connection.query(`TRUNCATE TABLE "${tableName}" CASCADE;`);
    }

    // Re-enable foreign key constraints
    await connection.query('SET session_replication_role = DEFAULT;');
};

export const createTenant = async (
    tenantRepository: Repository<Tenant>,
    name: string,
    address: string,
): Promise<Tenant> => {
    const tenant = await tenantRepository.save({
        name,
        address,
    });
    return tenant;
};

export const isJwt = (token: string | null): boolean => {
    if (token === null) return false;
    const parts = token.split('.');

    if (parts.length !== 3) {
        return false;
    }

    try {
        parts.forEach((part) => {
            Buffer.from(part, 'base64').toString('utf-8');
        });
        return true;
    } catch (err) {
        return false;
    }
};
