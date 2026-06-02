module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    moduleNameMapper: {
        '^~~(.*)$': '<rootDir>$1',
        '^#shared(.*)$': '<rootDir>/shared$1',
    },
    globals: {
        'ts-jest': {
            tsconfig: '.nuxt/tsconfig.json',
        },
    },
}
