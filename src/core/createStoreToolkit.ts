import { createResolvedStoreHooks } from "../hooks";
import { createStoreProvider } from "../providers";
import { createShallowStore } from "./createShallowStore";
import type {
  MutatorsStateCreator,
  StoreApiWithMutators,
  StoreMutatorTuple,
  StoreProviderResult,
  StoreToolkit,
} from "../types";

/**
 * Creates a complete Zustand store toolkit with global store, provider, and resolution hooks
 *
 * This is the all-in-one solution that combines:
 * - Global singleton store with shallow comparison
 * - Shared provider toolkit for isolated instances
 * - Smart hooks that resolve between global and context stores
 *
 * @template TState - The shape of your store state
 * @template TMutators - Array of mutators (middleware) applied to the store
 * @param storeCreator - Function that creates the store state and actions
 * @param options - Configuration options
 * @param options.name - Name for the store (used in DevTools and Provider)
 * @returns Complete toolkit with all hooks and utilities
 */
export function createStoreToolkit<TState, TMutators extends Array<StoreMutatorTuple> = []>(
  storeCreator: MutatorsStateCreator<TState, TMutators>,
  options: {
    name?: string;
  } = {}
): StoreToolkit<TState, TMutators> {
  const storeName = options.name ?? "Store";

  // Create global singleton store
  const { useStore, useStorePlain, useStoreApi } = createShallowStore<TState, TMutators>(
    storeCreator
  );

  // Create a single shared provider that will be reused
  const provider = createStoreProvider<TState, TMutators>(storeCreator, storeName);

  // Returns shared provider context/hooks for this toolkit instance
  function getProvider(): StoreProviderResult<TState, TMutators> {
    return provider;
  }

  // Backward-compatible alias
  function createProvider(): StoreProviderResult<TState, TMutators> {
    return getProvider();
  }

  // Use the shared provider's hooks for resolution
  const { useContextStoreOptional } = provider;

  // Helper to safely get context store (returns null if outside provider)
  function useSafeContextStore(): StoreApiWithMutators<TState, TMutators> | null {
    return useContextStoreOptional();
  }

  // Create resolution hooks
  const { useResolvedStoreApi, useResolvedValue, useResolvedStorePlain } = createResolvedStoreHooks(
    useStoreApi,
    useSafeContextStore
  );

  return {
    useStore,
    useStorePlain,
    useStoreApi,
    provider,
    getProvider,
    createProvider,
    useResolvedStoreApi,
    useResolvedStore: useResolvedStoreApi,
    useResolvedValue,
    useResolvedStoreWithSelector: useResolvedValue,
    useResolvedStorePlain,
  };
}
