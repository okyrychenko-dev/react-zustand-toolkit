# Compile-time type tests

This folder contains TypeScript programs that verify the package's public type contracts. They are
compiled by `pnpm run typecheck` through the root `tsconfig.json`; they are not Vitest runtime tests.

Each `*.type-test.ts` file should exercise a public consumer scenario that must either compile or
produce a deliberate `@ts-expect-error`. Keep runtime behavior tests beside their owning modules in
`__tests__` folders.

The package build starts from the public entry point, so these files do not become runtime exports
or bundled JavaScript.
