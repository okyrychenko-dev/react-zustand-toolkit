import { createResolvedStoreHooks } from "../hooks/createResolvedStoreHooks";
import { createStoreProvider } from "../providers/createStoreProvider";
import { createShallowStore } from "./createShallowStore";
import type { MutatorsStateCreator, StoreProviderResult, StoreToolkit } from "../types";
import type { StoreApi, StoreMutators } from "zustand";

/**
 * Creates a complete Zustand store toolkit with global store, provider, and resolution hooks
 *
 * This is the all-in-one solution that combines:
 * - Global singleton store with shallow comparison
 * - Provider factory for isolated instances
 * - Smart hooks that resolve between global and context stores
 *
 * @template TState - The shape of your store state
 * @template TMutators - Array of mutators (middleware) applied to the store
 * @param storeCreator - Function that creates the store state and actions
 * @param options - Configuration options
 * @param options.name - Name for the store (used in DevTools and Provider)
 * @returns Complete toolkit with all hooks and utilities
 */
export function createStoreToolkit<
  TState,
  TMutators extends Array<[keyof StoreMutators<TState, TState>, unknown]> = [],
>(
  storeCreator: MutatorsStateCreator<TState, TMutators>,
  options: {
    name?: string;
  } = {}
): StoreToolkit<TState> {
  const storeName = options.name ?? "Store";

  // Create global singleton store
  const { useStore, useStoreApi } = createShallowStore<TState, TMutators>(storeCreator);

  // Create a single shared provider that will be reused
  const sharedProvider = createStoreProvider<TState, TMutators>(storeCreator, storeName);

  // Returns shared provider context/hooks for this toolkit instance
  function getProvider(): StoreProviderResult<TState> {
    return sharedProvider;
  }

  // Backward-compatible alias
  function createProvider(): StoreProviderResult<TState> {
    return getProvider();
  }

  // Use the shared provider's hooks for resolution
  const { useOptionalContext } = sharedProvider;

  // Helper to safely get context store (returns null if outside provider)
  function useSafeContextStore(): StoreApi<TState> | null {
    return useOptionalContext();
  }

  // Create resolution hooks
  const { useResolvedStore, useResolvedStoreWithSelector } = createResolvedStoreHooks(
    useStoreApi,
    useSafeContextStore
  );

  return {
    useStore,
    useStoreApi,
    getProvider,
    createProvider,
    useResolvedStore,
    useResolvedStoreWithSelector,
  };
}
