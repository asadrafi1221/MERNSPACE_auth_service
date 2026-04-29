/* eslint-disable @typescript-eslint/no-unused-vars */
import { Repository } from 'typeorm';
import { User } from '../entity/User';
import { UserData } from '../types';
import { Roles } from '../constants';
import createHttpError from 'http-errors';
import bcrypt from 'bcrypt';

export class UserService {
    constructor(private userRepository: Repository<User>) {}

    async create({ firstName, lastName, email, password }: UserData) {
        const saltRounds = 10;

        const hashpassword = await bcrypt.hash(password, saltRounds);

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
}
