import { defineConfig } from '@hey-api/openapi-ts';

export default defineConfig({
  input: './swagger/merged.json',
  output: './src',
  plugins: [
    '@hey-api/client-fetch', // Bundled fetch client (runtime)
    '@hey-api/typescript', // TypeScript types  → types.gen.ts
    '@hey-api/sdk', // Service functions → sdk.gen.ts
  ],
});
