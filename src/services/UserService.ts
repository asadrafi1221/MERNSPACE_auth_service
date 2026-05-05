/* eslint-disable @typescript-eslint/no-unused-vars */
import { Repository } from 'typeorm';
import { User } from '../entity/User';
import { UserData, UpdateUserData } from '../types';
import { Roles } from '../constants';
import createHttpError from 'http-errors';
import { CredentialService } from './CredentialService';

export class UserService {
    constructor(
        private userRepository: Repository<User>,
        private credentialService: CredentialService,
    ) {}

    get credentialServiceInstance() {
        return this.credentialService;
    }

    async create({ firstName, lastName, email, password, tenantId }: UserData) {
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
                role: Roles.CUSTOMER,
                tenant: tenantId ? { id: tenantId } : undefined,
            });

            return user;
        } catch (err) {
            const error = createHttpError(
                500,
                'Failed to store the user in database ',
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
        });
    }

    async getAllUsers() {
        return await this.userRepository.find();
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

        await this.userRepository.update(id, updateData);
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
