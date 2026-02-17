/** @type {import('jest').Config} */
const config = {
  verbose: true,
  testEnvironment: 'node',
  transform: {},
  moduleNameMapper: {
    '^(\.{1,2}/.*)\.js$': '$1',
  },
  testMatch: [
    '**/tests/**/*.test.js'
  ],
};

export default config;
