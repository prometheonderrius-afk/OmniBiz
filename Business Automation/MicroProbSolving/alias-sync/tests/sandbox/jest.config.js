module.exports = {
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.(t|j)sx?$': '@swc/jest',
  },
  moduleNameMapper: {
    // @alias-sync-start
      '^@/(.*)$': '<rootDir>/src/$1',
      '^@components/(.*)$': '<rootDir>/src/components/$1',
      '^db$': '<rootDir>/src/db/index.ts',
    // @alias-sync-end
    '\\.(css|less|sass|scss)$': 'identity-obj-proxy',
  }
};
