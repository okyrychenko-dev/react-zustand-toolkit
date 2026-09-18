// Core utilities
export { createShallowStore, createStoreToolkit } from "./core";

// Provider utilities
export { createStoreProvider } from "./providers";

// Hook utilities
export { createResolvedStoreHooks } from "./hooks";

// React 19 utilities
// eslint-disable-next-line @typescript-eslint/no-deprecated -- Preserves compatibility exports until the next major release.
export { createTransitionAction, useActionStateAdapter, useOptimisticReducer } from "./react19";

// Types
export type {
  MutatorsStateCreator,
  ResolvedStoreBindings,
  ShallowStoreBindings,
  SimpleStateCreator,
  StoreApiWithMutators,
  StorePlainHook,
  StoreProviderConfig,
  StoreProviderProps,
  StoreProviderResult,
  StoreMutatorTuple,
  StoreToolkit,
  StoreValueHook,
} from "./types";
