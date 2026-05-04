import { Request, Response, NextFunction } from 'express';

interface JWTPayload {
    sub: string;
    role?: string;
}

interface AuthenticatedRequest extends Request {
    auth: {
        sub: string;
        role: string;
    };
}

interface Cookies {
    accessToken?: string;
}

interface ExpressJwtOptions {
    credentialsRequired?: boolean;
}

export const expressjwt = jest.fn(
    (options: ExpressJwtOptions) =>
        (req: Request, res: Response, next: NextFunction) => {
            // Extract token from cookie
            const cookies = req.cookies as Cookies;
            const cookieToken = cookies.accessToken;

            // If credentialsRequired is true and no token, reject the request
            if (options.credentialsRequired && !cookieToken) {
                const error = new Error(
                    'No authorization token was found',
                ) as Error & { code: string; status: number };
                error.code = 'credentials_required';
                error.status = 401;
                return next(error);
            }

            let userSub = '1';
            let role = 'customer';

            if (cookieToken) {
                try {
                    // Decode JWT token (format: header.payload.signature)
                    const parts = cookieToken.split('.');
                    if (parts.length === 3) {
                        // Decode the payload (second part)
                        const payload = JSON.parse(
                            Buffer.from(parts[1], 'base64').toString(),
                        ) as JWTPayload;
                        userSub = payload.sub || '1';
                        role = payload.role || 'customer';
                    }
                } catch {
                    // If token is invalid and credentials are required, reject
                    if (options.credentialsRequired) {
                        const jwtError = new Error('Invalid token') as Error & {
                            code: string;
                            status: number;
                        };
                        jwtError.code = 'invalid_token';
                        jwtError.status = 401;
                        return next(jwtError);
                    }
                    // Fallback to default
                    userSub = '1';
                    role = 'customer';
                }
            } else if (!options.credentialsRequired) {
                // If no token but credentials not required, set default
                (req as AuthenticatedRequest).auth = { sub: userSub, role };
            }

            if (cookieToken || !options.credentialsRequired) {
                (req as AuthenticatedRequest).auth = { sub: userSub, role };
            }
            next();
        },
);
