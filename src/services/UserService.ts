/* eslint-disable @typescript-eslint/no-unused-vars */
import { Repository } from 'typeorm';
import { User } from '../entity/User';
import { UserData } from '../types';
import { Roles } from '../constants';
import createHttpError from 'http-errors';
import { CredentialService } from './CredentialService';

export class UserService {
    constructor(
        private userRepository: Repository<User>,
        private credentialService: CredentialService,
    ) {}

    async create({ firstName, lastName, email, password }: UserData) {
        const hashpassword =
            await this.credentialService.hashPassword(password);

        const userExisted = await this.userRepository.findOne({
            where: { email },
        });

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

    async login({ email, password }: { email: string; password: string }) {
        const user = await this.userRepository.findOne({
            where: { email },
        });

        if (!user) {
            const error = createHttpError(401, 'Invalid credentials');
            throw error;
        }

        const isPasswordValid = await this.credentialService.comparePassword(
            password,
            user.password,
        );

        if (!isPasswordValid) {
            const error = createHttpError(401, 'Invalid credentials');
            throw error;
        }

        return user;
    }
    async findById(id: number) {
        return await this.userRepository.findOne({
            where: {
                id,
            },
        });
    }
}
