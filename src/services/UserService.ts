/* eslint-disable @typescript-eslint/no-unused-vars */
import { Repository } from 'typeorm';
import { User } from '../entity/User';
import { UserData } from '../types';
import { Roles } from '../constants';
import createHttpError from 'http-errors';

export class UserService {
    constructor(private userRepository: Repository<User>) {}

    async create({ firstName, lastName, email, password }: UserData) {
        try {
            const user = await this.userRepository.save({
                firstName,
                lastName,
                email,
                password,
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
}
