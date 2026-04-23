import { Response } from 'express';
import { RegisterUserRequest } from '../types';
import { UserService } from '../services/UserService';

export class AuthController {
    userService: UserService;
    constructor(userService: UserService) {
        this.userService = userService;
    }
    async register(req: RegisterUserRequest, res: Response) {
        const { firstName, lastName, email, password } = req.body;

        const user = await this.userService.create({
            firstName,
            lastName,
            email,
            password,
        });

        res.status(201).send({
            id: user.id,
        });
    }
}
