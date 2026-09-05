// Core utilities
export { createShallowStore, createStoreToolkit } from "./core";
export type { ShallowStoreBindings, StoreToolkit } from "./core";

// Provider utilities
export { createStoreProvider } from "./providers";
export type { StoreProviderConfig, StoreProviderProps, StoreProviderResult } from "./providers";

// Hook utilities
export { createResolvedStoreHooks } from "./hooks";
export type { ResolvedStoreBindings, StorePlainHook, StoreValueHook } from "./hooks";

// React 19 utilities
export { createTransitionAction, useActionStateAdapter, useOptimisticReducer } from "./react19";

// Shared store types
export type {
  MutatorsStateCreator,
  SimpleStateCreator,
  StoreApiWithMutators,
  StoreMutatorTuple,
} from "./types";
