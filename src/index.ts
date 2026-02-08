// Core utilities
export { createShallowStore } from "./core/createShallowStore";
export { createStoreToolkit } from "./core/createStoreToolkit";

// Provider utilities
export { createStoreProvider } from "./providers/createStoreProvider";

// Hook utilities
export { createResolvedStoreHooks } from "./hooks/createResolvedStoreHooks";

// React 19 utilities
export { createTransitionAction } from "./react19/createTransitionAction";
export { useActionStateAdapter } from "./react19/useActionStateAdapter";
export { useOptimisticReducer } from "./react19/useOptimisticReducer";

// Types
export type {
  MutatorsStateCreator,
  ShallowStoreBindings,
  SimpleStateCreator,
  StoreProviderConfig,
  StoreProviderProps,
  StoreProviderResult,
  StoreToolkit,
} from "./types";
