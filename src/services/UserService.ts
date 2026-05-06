 
import { Repository } from 'typeorm';
import { User } from '../entity/User';
import { UserData, UpdateUserData } from '../types';
import { Roles } from '../constants';
import createHttpError from 'http-errors';
import { CredentialService } from './CredentialService';

export class UserService {
    constructor(
        private readonly userRepository: Repository<User>,
        private readonly credentialService: CredentialService,
    ) {}

    get credentialServiceInstance() {
        return this.credentialService;
    }

    async create({
        firstName,
        lastName,
        email,
        password,
        tenantId,
        role,
    }: UserData) {
        const hashpassword =
            await this.credentialService.hashPassword(password);

        const userExisted = await this.findByEmail(email);

        if (userExisted) {
            const error = createHttpError(400, 'Email alreadys exist');
            throw error;
        }
        try {
            const user = await this.userRepository.save({
                firstName,
                lastName,
                email,
                password: hashpassword,
                role: role || Roles.CUSTOMER,
                tenant: tenantId ? { id: tenantId } : undefined,
            });

            return user;
        } catch (err) {
            const errorMessage =
                err instanceof Error ? err.message : 'Unknown database error';
            const error = createHttpError(
                500,
                `Failed to store the user in database: ${errorMessage}`,
            );
            throw error;
        }
    }

    async findByEmail(email: string) {
        return await this.userRepository.findOne({
            where: { email },
        });
    }

    async findById(id: number) {
        return await this.userRepository.findOne({
            where: {
                id,
            },
            relations: {
                tenant: true,
            },
        });
    }

    async getAllUsers(paginationParams?: {
        page: number;
        limit: number;
        search?: string;
    }) {
        const { page = 1, limit = 10, search } = paginationParams || {};
        const offset = (page - 1) * limit;

        const queryBuilder = this.userRepository
            .createQueryBuilder('user')
            .leftJoinAndSelect('user.tenant', 'tenant')
            .take(limit)
            .skip(offset)
            .orderBy('user.id', 'DESC');

        if (search) {
            queryBuilder.where(
                '(user.firstName ILIKE :search OR user.lastName ILIKE :search OR user.email ILIKE :search)',
                { search: `%${search}%` },
            );
        }

        const [users, total] = await queryBuilder.getManyAndCount();

        return {
            users: users.map((user) => ({
                ...user,
                password: undefined,
            })),
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
                hasNext: page * limit < total,
                hasPrev: page > 1,
            },
        };
    }

    async updateUser(id: number, updateData: UpdateUserData) {
        const user = await this.findById(id);
        if (!user) {
            const error = createHttpError(404, 'User not found');
            throw error;
        }

        // Check if email is being updated and if it already exists
        if (updateData.email && updateData.email !== user.email) {
            const existingUser = await this.findByEmail(updateData.email);
            if (existingUser) {
                const error = createHttpError(400, 'Email already exists');
                throw error;
            }
        }

        // Hash password if it's being updated
        if (updateData.password) {
            updateData.password = await this.credentialService.hashPassword(
                updateData.password,
            );
        }

        // Handle tenantId conversion for database update
        const { tenantId, ...otherFields } = updateData;
        const updatePayload: Partial<User> = { ...otherFields };

        if (tenantId !== undefined) {
            (updatePayload as { tenant?: { id: number } | null }).tenant =
                tenantId ? { id: tenantId } : null;
        }

        await this.userRepository.update(id, updatePayload);
        return await this.findById(id);
    }

    async deleteUser(id: number) {
        const user = await this.findById(id);
        if (!user) {
            const error = createHttpError(404, 'User not found');
            throw error;
        }

        await this.userRepository.delete(id);
        return user;
    }
}
