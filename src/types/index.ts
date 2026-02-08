import type { ReactNode } from "react";
import type { StateCreator, StoreApi, StoreMutators } from "zustand";

/**
 * Store bindings with shallow comparison built-in
 */
export interface ShallowStoreBindings<TState> {
  /**
   * Hook to access store state with automatic shallow comparison
   * Can be used with or without selector
   */
  useStore: {
    (): TState;
    <T>(selector: (state: TState) => T, equalityFn?: (a: T, b: T) => boolean): T;
  };
  /**
   * Direct access to store API for advanced usage
   */
  useStoreApi: StoreApi<TState>;
}

/**
 * Configuration for store provider
 */
export interface StoreProviderConfig<TState = unknown> {
  /**
   * Enable Redux DevTools integration
   * @default process.env.NODE_ENV === 'development'
   */
  enableDevtools?: boolean;
  /**
   * Name for the DevTools instance
   * @default 'Store'
   */
  devtoolsName?: string;
  /**
   * Callback called after store is created
   * Use this to initialize the store, register middlewares, etc.
   */
  onStoreCreate?: (store: StoreApi<TState>) => void;
}

/**
 * Props for generated provider component
 */
export interface StoreProviderProps<TState = unknown> extends StoreProviderConfig<TState> {
  children: ReactNode;
}

/**
 * Result of createStoreProvider factory
 */
export interface StoreProviderResult<TState> {
  /**
   * Provider component to wrap your app/subtree
   */
  Provider: (props: StoreProviderProps<TState>) => ReactNode;
  /**
   * Hook to access store from context (throws if outside provider)
   */
  useContext: () => StoreApi<TState>;
  /**
   * Hook to access store with selector from context
   */
  useContextStore: {
    (): TState;
    <T>(selector: (state: TState) => T, equalityFn?: (a: T, b: T) => boolean): T;
  };
  /**
   * Check if component is inside provider
   */
  useIsInsideProvider: () => boolean;
  /**
   * Hook to access store from context (returns null if outside provider)
   */
  useOptionalContext: () => StoreApi<TState> | null;
}

/**
 * Combined result with both global and provider capabilities
 */
export interface StoreToolkit<TState> extends ShallowStoreBindings<TState> {
  /**
   * Get shared provider for isolated store instances.
   * Multiple calls return the same provider/context hooks.
   */
  getProvider: () => StoreProviderResult<TState>;
  /**
   * Backward-compatible alias for getProvider
   */
  createProvider: () => StoreProviderResult<TState>;
  /**
   * Hook that resolves to context store if inside provider, otherwise global store
   */
  useResolvedStore: () => StoreApi<TState>;
  /**
   * Hook that resolves store and applies selector with shallow comparison
   */
  useResolvedStoreWithSelector: {
    (): TState;
    <T>(selector: (state: TState) => T, equalityFn?: (a: T, b: T) => boolean): T;
  };
}

/**
 * Type alias for StateCreator without mutators for simpler typing
 */
export type SimpleStateCreator<TState> = StateCreator<TState, [], [], TState>;

/**
 * Type alias for StateCreator with mutators support
 */
export type MutatorsStateCreator<
  TState,
  TMutators extends Array<[keyof StoreMutators<TState, TState>, unknown]> = [],
> = StateCreator<TState, [], TMutators, TState>;
