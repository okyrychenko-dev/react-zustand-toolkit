# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.4.1] - 2026-05-27

### Added

- Exported store hook and mutator helper types from the public package entrypoint.

### Changed

- Refreshed the package lockfile after dependency maintenance updates.

## [0.4.0] - 2026-04-18

### Breaking Changes

- Removed provider-level Redux DevTools props:
  - `enableDevtools`
  - `devtoolsName`
- `createStoreProvider` no longer auto-connects provider instances to Redux DevTools

### Changed

- Clarified the library contract around provider responsibilities:
  - providers now focus on isolated store instances, lifecycle hooks, and context access
  - Zustand DevTools integration belongs in the store creator via `zustand/middleware`
- Reworked README examples and API guidance around:
  - `createShallowStore`
  - `createStoreProvider`
  - `createStoreToolkit`
  - resolved hooks
  - plain-selector hooks
  - middleware composition
- Tightened local repository engineering rules:
  - no `any`
  - no type assertions
  - no non-null assertions

### Fixed

- Removed provider-level DevTools implementation complexity from the runtime
- Improved provider hook error messaging
- Closed remaining branch and lifecycle test gaps across provider and resolved hook flows
- Achieved full automated coverage for the package test suite

## [0.3.0] - 2026-03-07

### Added

- React 19 helper utilities:
  - `createTransitionAction` for transition-wrapped store actions
  - `useActionStateAdapter` for action-state integration patterns
  - `useOptimisticReducer` for optimistic UI flows
- Explicit plain-selector escape hatches across the API:
  - `useStorePlain`
  - `useContextStorePlain`
  - `useResolvedStorePlain`
- Explicit raw-store access naming:
  - `useContextStoreApi`
  - `useContextStoreOptional`
  - `useResolvedStoreApi`
- Shared `provider` property in toolkit as the primary provider accessor
- Compile-time middleware compatibility coverage for devtools, persist, subscribeWithSelector, immer, and combined paths

### Changed

- `createProvider()` is now a backward-compatible alias for the shared `provider` / `getProvider()` contract
- `useContextStoreOptional()` is now the primary optional provider API hook name
- `useResolvedValue()` is now the primary resolved selector hook name
- `README.md` updated to document the symmetric value/plain/api access matrix

### Fixed

- Deprecated `onStoreCreate` in favor of `onStoreInit` and `onStoreReady` lifecycle semantics
- Preserved middleware mutator types through global, provider, and toolkit APIs

## [0.2.0] - 2026-01-25

### Breaking Changes

- ⚠️ **Updated minimum peer dependency versions**:
  - React: `^18.0.0 || ^19.0.0` (removed React 17 support)
  - Zustand: `^5.0.0` (removed Zustand 4.x support)

### Changed

- 🔧 **ESLint configuration**: Added `curly: ["error", "all"]` rule
- 📝 Cleaned up trailing whitespace in JSDoc comments

## [0.1.2] - 2024-12-28

### Documentation

- 📚 **Comprehensive JSDoc documentation** for Zustand toolkit utilities
  - `createShallowStore`: detailed explanation of shallow comparison benefits with performance notes
  - Complete type parameter and return value documentation
  - 4 usage examples: basic store, DevTools integration, multiple selectors optimization, imperative API access
- 🎯 **createStoreProvider** documentation with provider pattern and isolated store examples
- 📝 **README improvements** with shallow comparison benefits and quick start guide
- 🧪 **Test enhancements** with additional edge cases and provider integration examples

## [0.1.1] - 2024-12-26

### Fixed

- 📝 Minor documentation and type improvements

## [0.1.0] - 2024-12-24

### Added

- Initial release of React Zustand Toolkit
- `createShallowStore` with built-in shallow comparison
- `createStoreProvider` for isolated store instances (SSR/tests/micro-frontends)
- `createStoreToolkit` with resolved hooks for global vs context stores
- Provider lifecycle API for isolated store initialization
- TypeScript types with generics and mutator support
- Test suite covering core utilities and provider behavior

[Unreleased]: https://github.com/okyrychenko-dev/react-zustand-toolkit/compare/v0.4.1...HEAD
[0.4.1]: https://github.com/okyrychenko-dev/react-zustand-toolkit/compare/v0.4.0...v0.4.1
[0.4.0]: https://github.com/okyrychenko-dev/react-zustand-toolkit/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/okyrychenko-dev/react-zustand-toolkit/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/okyrychenko-dev/react-zustand-toolkit/compare/v0.1.2...v0.2.0
[0.1.2]: https://github.com/okyrychenko-dev/react-zustand-toolkit/compare/v0.1.1...v0.1.2
[0.1.1]: https://github.com/okyrychenko-dev/react-zustand-toolkit/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/okyrychenko-dev/react-zustand-toolkit/releases/tag/v0.1.0
