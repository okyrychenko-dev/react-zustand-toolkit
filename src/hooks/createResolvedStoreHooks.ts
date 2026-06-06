import { useStore } from "zustand";
import { shallow } from "zustand/shallow";
import { useSelectorWithEquality } from "./useSelectorWithEquality";
import type { StoreApiWithMutators, StoreMutatorTuple } from "../types";

/**
 * Creates hooks that resolve between context store and global store
 *
 * This pattern allows components to work seamlessly both inside and outside a provider:
 * - Inside provider: uses isolated store from context
 * - Outside provider: falls back to global singleton store
 *
 * @template TState - The shape of your store state
 * @param globalStoreApi - The global singleton store API
 * @param useContextStore - Hook that returns store from context (or null if outside provider)
 * @returns Hooks for resolved store access
 */
export function createResolvedStoreHooks<TState, TMutators extends Array<StoreMutatorTuple> = []>(
  globalStoreApi: StoreApiWithMutators<TState, TMutators>,
  useContextStore: () => StoreApiWithMutators<TState, TMutators> | null
): {
  useResolvedStoreApi: () => StoreApiWithMutators<TState, TMutators>;
  useResolvedStore: () => StoreApiWithMutators<TState, TMutators>;
  useResolvedValue: {
    (): TState;
    <T>(selector: (state: TState) => T, equalityFn?: (a: T, b: T) => boolean): T;
  };
  useResolvedStoreWithSelector: {
    (): TState;
    <T>(selector: (state: TState) => T, equalityFn?: (a: T, b: T) => boolean): T;
  };
  useResolvedStorePlain: {
    (): TState;
    <T>(selector: (state: TState) => T): T;
  };
} {
  function useResolvedStoreApi(): StoreApiWithMutators<TState, TMutators> {
    const contextStore = useContextStore();
    return contextStore ?? globalStoreApi;
  }

  function useResolvedValue(): TState;
  function useResolvedValue<T>(
    selector: (state: TState) => T,
    equalityFn?: (a: T, b: T) => boolean
  ): T;
  function useResolvedValue<T>(
    selector?: (state: TState) => T,
    equalityFn?: (a: T | TState, b: T | TState) => boolean
  ): T | TState {
    const store = useResolvedStoreApi();
    const actualSelector = useSelectorWithEquality({
      cacheKey: store,
      equalityFn: equalityFn ?? shallow,
      selector: (state: TState): T | TState => (selector ? selector(state) : state),
    });

    return useStore(store, actualSelector);
  }

  function useResolvedStorePlain(): TState;
  function useResolvedStorePlain<T>(selector: (state: TState) => T): T;
  function useResolvedStorePlain<T>(selector?: (state: TState) => T): T | TState {
    const store = useResolvedStoreApi();
    const actualSelector = selector ?? ((state: TState) => state);
    return useStore<typeof store, T | TState>(store, actualSelector);
  }

  return {
    useResolvedStoreApi,
    useResolvedStore: useResolvedStoreApi,
    useResolvedValue,
    useResolvedStoreWithSelector: useResolvedValue,
    useResolvedStorePlain,
  };
}
