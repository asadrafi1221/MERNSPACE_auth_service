import { Request } from 'express';

export interface UserData {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
}
export interface RegisterUserRequest extends Request {
    body: UserData;
}

export interface LoginData {
    email: string;
    password: string;
}

export interface LoginUserRequest extends Request {
    body: LoginData;
}

export interface AuthRequest extends Request {
    auth: {
        id: number;
        role: string;
    };
}
