module.exports = {
	globals: {
		'ts-jest': {
			tsConfig: 'tsconfig.test.json',
		},
	},
	moduleDirectories: ['node_modules'],
	modulePathIgnorePatterns: ['<rootDir>/package'],
	moduleNameMapper: {
		'^ansi-logger$': '<rootDir>/src/index',
		'^ansi-logger/(.*)$': '<rootDir>/src/$1',
	},
	preset: 'ts-jest',
};
