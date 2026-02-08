# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- React 19 helper utilities:
  - `createTransitionAction` for transition-wrapped store actions
  - `useActionStateAdapter` for action-state integration patterns
  - `useOptimisticReducer` for optimistic UI flows
- Custom selector equality support for:
  - `useStore`
  - `useContextStore`
  - `useResolvedStoreWithSelector`
- New `getProvider()` API in toolkit as explicit shared-provider accessor

### Changed

- `createProvider()` is now documented as a backward-compatible alias to `getProvider()`
- `README.md` updated with React 19 usage patterns and custom equality examples

### Fixed

- Moved provider `onStoreCreate` initialization out of render-phase into effect lifecycle

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
- DevTools integration support via provider configuration
- TypeScript types with generics and mutator support
- Test suite covering core utilities and provider behavior

[Unreleased]: https://github.com/okyrychenko-dev/react-zustand-toolkit/compare/v0.2.0...HEAD
[0.2.0]: https://github.com/okyrychenko-dev/react-zustand-toolkit/compare/v0.1.2...v0.2.0
[0.1.2]: https://github.com/okyrychenko-dev/react-zustand-toolkit/compare/v0.1.1...v0.1.2
[0.1.1]: https://github.com/okyrychenko-dev/react-zustand-toolkit/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/okyrychenko-dev/react-zustand-toolkit/releases/tag/v0.1.0
