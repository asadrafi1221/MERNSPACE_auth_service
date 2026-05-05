import { Request } from 'express';

export interface UserData {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    tenantId?: number;
    role?: string;
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
        sub: number;
        role: string;
        jti?: string;
    };
}

export type AuthCookie = {
    accessToken: string;
    refreshToken: string;
};
export interface IRefreshTokenPayload {
    id: string;
}
export interface ITenantPayload {
    name: string;
    address: string;
}

export interface CreateTenantRequest extends Request {
    body: ITenantPayload;
}

export interface CreateUserRequest extends Request {
    body: UserData;
}

export interface UpdateUserData {
    firstName?: string;
    lastName?: string;
    email?: string;
    password?: string;
    role?: string;
    tenantId?: number;
}

export interface UpdateUserRequest extends Request {
    body: UpdateUserData;
}
