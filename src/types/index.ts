import type { ReactNode } from "react";
import type { Mutate, StateCreator, StoreApi, StoreMutatorIdentifier } from "zustand";

export type StoreMutatorTuple = [StoreMutatorIdentifier, unknown];
export type StoreApiWithMutators<TState, TMutators extends Array<StoreMutatorTuple> = []> = Mutate<
  StoreApi<TState>,
  TMutators
>;

export interface StoreValueHook<TState> {
  (): TState;
  <T>(selector: (state: TState) => T, equalityFn?: (a: T, b: T) => boolean): T;
}

export interface StorePlainHook<TState> {
  (): TState;
  <T>(selector: (state: TState) => T): T;
}

/**
 * Store bindings with shallow comparison built-in
 */
export interface ShallowStoreBindings<TState, TMutators extends Array<StoreMutatorTuple> = []> {
  /**
   * Hook to access store state with automatic shallow comparison
   * Can be used with or without selector
   */
  useStore: StoreValueHook<TState>;
  /**
   * Hook to access store state with plain Zustand selector semantics
   */
  useStorePlain: StorePlainHook<TState>;
  /**
   * Direct access to store API for advanced usage
   */
  useStoreApi: StoreApiWithMutators<TState, TMutators>;
}

/**
 * Configuration for store provider
 */
export interface StoreProviderConfig<
  TState = unknown,
  TMutators extends Array<StoreMutatorTuple> = [],
> {
  /**
   * Pure synchronous initialization hook invoked when the store instance is created.
   * This callback must stay idempotent and side-effect free.
   */
  onStoreInit?: (store: StoreApiWithMutators<TState, TMutators>) => void;
  /**
   * Post-commit lifecycle hook for side effects that need a ready store instance.
   */
  onStoreReady?: (store: StoreApiWithMutators<TState, TMutators>) => void;
  /**
   * @deprecated Use `onStoreReady` for post-commit side effects.
   */
  onStoreCreate?: (store: StoreApiWithMutators<TState, TMutators>) => void;
}

/**
 * Props for generated provider component
 */
export interface StoreProviderProps<
  TState = unknown,
  TMutators extends Array<StoreMutatorTuple> = [],
> extends StoreProviderConfig<TState, TMutators> {
  children: ReactNode;
}

/**
 * Result of createStoreProvider factory
 */
export interface StoreProviderResult<TState, TMutators extends Array<StoreMutatorTuple> = []> {
  /**
   * Provider component to wrap your app/subtree
   */
  Provider: (props: StoreProviderProps<TState, TMutators>) => ReactNode;
  /**
   * Hook to access store from context (throws if outside provider)
   */
  useContextStoreApi: () => StoreApiWithMutators<TState, TMutators>;
  /**
   * @deprecated Use `useContextStoreApi`.
   */
  useContext: () => StoreApiWithMutators<TState, TMutators>;
  /**
   * Hook to access store with selector from context
   */
  useContextStore: StoreValueHook<TState>;
  /**
   * Hook to access store with plain Zustand selector semantics from context
   */
  useContextStorePlain: StorePlainHook<TState>;
  /**
   * Check if component is inside provider
   */
  useIsInsideProvider: () => boolean;
  /**
   * Hook to access store from context (returns null if outside provider)
   */
  useContextStoreOptional: () => StoreApiWithMutators<TState, TMutators> | null;
  /**
   * @deprecated Use `useContextStoreOptional`.
   */
  useOptionalContext: () => StoreApiWithMutators<TState, TMutators> | null;
}

/**
 * Combined result with both global and provider capabilities
 */
export interface StoreToolkit<
  TState,
  TMutators extends Array<StoreMutatorTuple> = [],
> extends ShallowStoreBindings<TState, TMutators> {
  /**
   * Shared provider toolkit for isolated store instances.
   */
  provider: StoreProviderResult<TState, TMutators>;
  /**
   * Get the shared provider toolkit.
   * Multiple calls return the same provider/context hooks.
   */
  getProvider: () => StoreProviderResult<TState, TMutators>;
  /**
   * @deprecated Use `provider` or `getProvider()`.
   */
  createProvider: () => StoreProviderResult<TState, TMutators>;
  /**
   * Hook that resolves to context store if inside provider, otherwise global store
   */
  useResolvedStoreApi: () => StoreApiWithMutators<TState, TMutators>;
  /**
   * @deprecated Use `useResolvedStoreApi`.
   */
  useResolvedStore: () => StoreApiWithMutators<TState, TMutators>;
  /**
   * Hook that resolves store and applies selector with shallow comparison
   */
  useResolvedValue: StoreValueHook<TState>;
  /**
   * @deprecated Use `useResolvedValue`.
   */
  useResolvedStoreWithSelector: StoreValueHook<TState>;
  /**
   * Hook that resolves store and applies plain Zustand selector semantics
   */
  useResolvedStorePlain: StorePlainHook<TState>;
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
  TMutators extends Array<StoreMutatorTuple> = [],
> = StateCreator<TState, [], TMutators, TState>;
