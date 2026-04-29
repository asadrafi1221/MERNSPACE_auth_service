import { Response } from 'express';

export const setAccessTokenCookie = (res: Response, accessToken: string) => {
    res.cookie('accessToken', accessToken, {
        domain: 'localhost',
        sameSite: 'strict',
        maxAge: 1000 * 60 * 60, // 1h
        httpOnly: true, // Very Important
    });
};

export const setRefreshTokenCookie = (res: Response, refreshToken: string) => {
    res.cookie('refreshToken', refreshToken, {
        domain: 'localhost',
        sameSite: 'strict',
        maxAge: 1000 * 60 * 60 * 24 * 365, // 1y
        httpOnly: true, // Very Important
    });
};

export const setTokenCookies = (
    res: Response,
    accessToken: string,
    refreshToken: string,
) => {
    setAccessTokenCookie(res, accessToken);
    setRefreshTokenCookie(res, refreshToken);
};
