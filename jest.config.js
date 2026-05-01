/** @type {import("jest").Config} **/
module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    roots: ['<rootDir>'],
    testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
    extensionsToTreatAsEsm: ['.ts'],
    transform: {
        '^.+\\.ts$': [
            'ts-jest',
            {
                useESM: true,
                tsconfig: {
                    module: 'ESNext',
                },
            },
        ],
    },
    moduleNameMapper: {
        '^jwks-rsa$': '<rootDir>/src/__mocks__/jwks-rsa.ts',
        '^jose$': '<rootDir>/src/__mocks__/jose.ts',
        '^express-jwt$': '<rootDir>/src/__mocks__/express-jwt.ts',
    },
    transformIgnorePatterns: ['node_modules/(?!(jose|jwks-rsa|express-jwt)/)'],
    collectCoverageFrom: ['src/**/*.ts', '!src/**/*.d.ts'],
};
