# ADR 0001: Make Resolved store behavior the toolkit default

## Status

Accepted

## Context

Callers previously had to understand separate Global, Provider, and Resolved hook families plus the
optional Provider-store lookup used to assemble them. That exposed the toolkit's wiring rather than
hiding it. It also made the module-scoped Global store look suitable for request-specific server
data even though it is process-scoped.

## Decision

`createStoreToolkit` is a declarative, Resolved-store-first interface. Provider placement declares
scope. Top-level hooks select the nearest matching Provider store and fall back to the Global store.
Explicit Global access lives under `global`.

Toolkit creation receives one synchronous Store recipe. The recipe converts typed,
transport-decoded input into the complete Zustand state creator. The Global store is created from
`globalInput`; each Provider creates an isolated store from its required `input` prop. Input is
creation-only. Readiness effects begin after commit.

The Global store is process-scoped and must not hold request-specific server data. Provider stores
are the request-local SSR seam. React Server Components do not invoke hooks or access Store handles;
they pass serialized data to client components that render Providers.

Standalone factories remain public for advanced composition. Optional lookup is named
`useProviderStoreOptional` and remains available only from `createStoreProvider`.

## Consequences

- Normal consumers learn one selection vocabulary and use React tree placement for scope.
- Retained selections reset when the Resolved store changes.
- Server requests remain isolated when each request renders its own Provider tree.
- Equivalent decoded server and client input is required for hydration parity.
- The old toolkit names are removed in the intentional major-version interface cut.
