const JwksClient = {
    expressJwtSecret: jest.fn(() => ({
        jwksUri: 'mock-jwks-uri',
        cache: true,
        rateLimit: true,
    })),
};

export const GetVerificationKey = jest.fn();

export default JwksClient;
