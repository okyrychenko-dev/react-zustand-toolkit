import { createStore, useStore } from "zustand";
import { useShallow } from "zustand/react/shallow";
import type { MutatorsStateCreator, ShallowStoreBindings } from "../types";
import type { StoreApi, StoreMutators } from "zustand";

/**
 * Creates a Zustand store with automatic shallow comparison for all selectors
 *
 * @template TState - The shape of your store state
 * @template TMutators - Array of mutators (middleware) applied to the store
 * @param storeCreator - Function that creates the store state and actions
 * @returns Object with useStore hook (with shallow comparison) and useStoreApi
 */
export function createShallowStore<
  TState,
  TMutators extends Array<[keyof StoreMutators<TState, TState>, unknown]> = [],
>(storeCreator: MutatorsStateCreator<TState, TMutators>): ShallowStoreBindings<TState> {
  const storeApi: StoreApi<TState> = createStore<TState, TMutators>(storeCreator);

  function useShallowStore(): TState;
  function useShallowStore<T>(selector: (state: TState) => T): T;
  function useShallowStore<T>(selector?: (state: TState) => T): T | TState {
    const actualSelector = (state: TState): T | TState => (selector ? selector(state) : state);

    return useStore(storeApi, useShallow(actualSelector));
  }

  return {
    useStore: useShallowStore,
    useStoreApi: storeApi,
  };
}
