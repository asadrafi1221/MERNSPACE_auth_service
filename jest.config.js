/** @type {import("jest").Config} **/
module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    roots: ['<rootDir>/src'],
    testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
    moduleNameMapper: {
        '^jwks-rsa$': '<rootDir>/src/__mocks__/jwks-rsa.ts',
        '^jose$': '<rootDir>/src/__mocks__/jose.ts',
        '^express-jwt$': '<rootDir>/src/__mocks__/express-jwt.ts',
    },
    transformIgnorePatterns: ['node_modules/(?!(jose|jwks-rsa|express-jwt)/)'],
    collectCoverageFrom: ['src/**/*.ts', '!src/**/*.d.ts'],
    setupFilesAfterEnv: ['<rootDir>/src/test/setup.ts'],
    moduleFileExtensions: ['ts', 'js', 'json'],
    testPathIgnorePatterns: ['/node_modules/', '/dist/'],
    coverageProvider: 'v8',
    coverageCollector: true,
    verbose: true,
    collectCoverageFrom: ['src/**/*.ts', '!tests/**', '!**/node_modules/**'],
};
