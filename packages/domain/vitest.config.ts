import { defineConfig } from 'vitest/config';
export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
  },
  esbuild: {
    // Pass as a JSON string so esbuild reads the full options (including
    // noUncheckedIndexedAccess etc.) without TypeScript complaining about
    // the narrow TsconfigRaw interface exposed by this esbuild version.
    tsconfigRaw: JSON.stringify({
      compilerOptions: {
        target: 'ES2022',
        strict: true,
        useDefineForClassFields: true,
        noUncheckedIndexedAccess: true,
        exactOptionalPropertyTypes: true,
        noImplicitOverride: true,
      },
    }),
  },
});
