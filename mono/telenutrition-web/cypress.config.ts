import { defineConfig } from 'cypress';

export default defineConfig({
  defaultCommandTimeout: 5000,
  viewportWidth: 1200,
  viewportHeight: 800,
  pageLoadTimeout: 50000,
  requestTimeout: 10000,
  e2e: {
    baseUrl: 'http://foodsmart-devenv.com:3000',
  },
  component: {
    devServer: {
      framework: 'next',
      bundler: 'webpack',
    },
  },
});
