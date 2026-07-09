module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    moduleNameMapper: {
        '^~~(.*)$': '<rootDir>$1',
        '^#shared(.*)$': '<rootDir>/shared$1',
    },
    transform: {
        '^.+\\.tsx?$': [
            'ts-jest',
            {
                tsconfig: 'tsconfig.test.json',
                diagnostics: false,
            },
        ],
    },
}
