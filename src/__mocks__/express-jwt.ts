import { Request, Response, NextFunction } from 'express';

interface JWTPayload {
    sub: string;
    role?: string;
}

interface AuthenticatedRequest extends Request {
    auth: {
        id: number;
        role: string;
    };
}

interface Cookies {
    accessToken?: string;
}

export const expressjwt = jest.fn(
    () => (req: Request, res: Response, next: NextFunction) => {
        // Extract token from cookie
        const cookies = req.cookies as Cookies;
        const cookieToken = cookies.accessToken;
        let userId = 1;
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
                    userId = parseInt(payload.sub) || 1;
                    role = payload.role || 'customer';
                }
            } catch {
                // Fallback to default
                userId = 1;
                role = 'customer';
            }
        }

        (req as AuthenticatedRequest).auth = { id: userId, role };
        next();
    },
);
